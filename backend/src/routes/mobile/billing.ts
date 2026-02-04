import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../../config/database';
import { UserModel } from '../../models/UserModel';
import { authenticateToken } from '../../middleware/auth';
import emailService from '../../services/emailService';

const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Validation middleware
const validateSubscription = [
  body('planId').notEmpty(),
  body('paymentMethodId').optional().notEmpty(),
];

const validatePaymentMethod = [
  body('paymentMethodId').notEmpty(),
];

// @route   POST /api/billing/subscription
// @desc    Create new subscription
// @access  Private
router.post('/subscription', authenticateToken as any, validateSubscription, async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { planId, paymentMethodId, circleId, trialDays, seats = 1, coupon } = req.body;
    const userId = req.user.id;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already has an active subscription
    const { rows: existingSubs } = await pool.query(
      "SELECT id FROM subscriptions WHERE user_id = $1 AND status IN ('active', 'trialing')",
      [userId]
    );

    if (existingSubs.length > 0) {
      return res.status(400).json({ message: 'User already has an active subscription' });
    }

    // Get plan details from Stripe
    const plan = await stripe.plans.retrieve(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Create or get Stripe customer
    let stripeCustomerId = user.metadata?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user.id.toString(),
        },
      });

      stripeCustomerId = customer.id;
      await UserModel.findByIdAndUpdate(userId, { stripeCustomerId });
    }

    // Attach payment method if provided
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId,
      });

      // Set as default payment method
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: planId, quantity: Math.max(1, Number(seats) || 1) }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      trial_period_days: trialDays ? Number(trialDays) : undefined,
      coupon: coupon || undefined,
      metadata: {
        userId: user.id.toString(),
        circleId: circleId || (user.circleIds && user.circleIds[0]) || '',
        seats: String(Math.max(1, Number(seats) || 1)),
      },
    });

    // Create subscription record in database
    const { rows: subRows } = await pool.query(
      `INSERT INTO subscriptions (
        user_id, circle_id, stripe_subscription_id, stripe_customer_id, 
        plan, status, current_period_start, current_period_end, cancel_at_period_end
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        userId,
        circleId || (user.circleIds && user.circleIds[0]) || null,
        subscription.id,
        stripeCustomerId,
        {
          id: plan.id,
          name: plan.nickname,
          price: plan.amount / 100,
          currency: plan.currency,
          interval: plan.interval,
          intervalCount: plan.interval_count,
        },
        subscription.status,
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
        subscription.cancel_at_period_end
      ]
    );

    const subscriptionRecord = subRows[0];

    res.status(201).json({
      message: 'Subscription created successfully',
      subscription: {
        id: subscriptionRecord.id,
        status: subscriptionRecord.status,
        plan: subscriptionRecord.plan,
        currentPeriodEnd: subscriptionRecord.current_period_end,
        circleId: subscriptionRecord.circle_id,
      },
      clientSecret: subscription.latest_invoice.payment_intent?.client_secret,
    });
  } catch (error: any) {
    console.error('Create subscription error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/billing/subscription
// @desc    Get current subscription
// @access  Private
router.get('/subscription', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const { rows } = await pool.query(
      `SELECT s.*, c.data->>'name' as circle_name
       FROM subscriptions s
       LEFT JOIN unified_entities c ON s.circle_id = c.id
       WHERE s.user_id = $1 AND s.status IN ('active', 'trialing', 'past_due')
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    const sub = rows[0];
    res.json({ 
        subscription: {
            id: sub.id,
            userId: sub.user_id,
            circleId: sub.circle_id,
            circleName: sub.circle_name,
            stripeSubscriptionId: sub.stripe_subscription_id,
            stripeCustomerId: sub.stripe_customer_id,
            plan: sub.plan,
            status: sub.status,
            currentPeriodStart: sub.current_period_start,
            currentPeriodEnd: sub.current_period_end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            createdAt: sub.created_at,
            updatedAt: sub.updated_at
        } 
    });
  } catch (error: any) {
    console.error('Get subscription error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/billing/subscription/:id
// @desc    Update subscription
// @access  Private
router.put('/subscription/:id?', authenticateToken as any, [
  body('planId').notEmpty(),
], async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { planId, seats } = req.body;
    const userId = req.user.id;

    const { rows: subRows } = await pool.query(
      "SELECT * FROM subscriptions WHERE user_id = $1 AND status IN ('active', 'trialing') LIMIT 1",
      [userId]
    );

    if (subRows.length === 0) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    const subscription = subRows[0];

    // Update subscription in Stripe
    const current = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
    const itemId = current.items.data[0]?.id;
    const updatedSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      items: [ itemId ? { id: itemId, price: planId, quantity: seats ? Math.max(1, Number(seats)) : current.items.data[0]?.quantity || 1 } : { price: planId, quantity: seats ? Math.max(1, Number(seats)) : 1 } ],
      proration_behavior: 'create_prorations',
      metadata: {
        ...(current.metadata || {}),
        seats: String(seats ? Math.max(1, Number(seats)) : (current.metadata?.seats || current.items.data[0]?.quantity || 1)),
      }
    });

    // Update plan details
    const plan = await stripe.plans.retrieve(planId);
    const planData = {
      id: plan.id,
      name: plan.nickname,
      price: plan.amount / 100,
      currency: plan.currency,
      interval: plan.interval,
      intervalCount: plan.interval_count,
    };

    const { rows: updatedRows } = await pool.query(
      `UPDATE subscriptions SET 
         plan = $1,
         current_period_start = $2,
         current_period_end = $3,
         updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [
        planData,
        new Date(updatedSubscription.current_period_start * 1000),
        new Date(updatedSubscription.current_period_end * 1000),
        subscription.id
      ]
    );

    const sub = updatedRows[0];
    res.json({
      message: 'Subscription updated successfully',
      subscription: {
        id: sub.id,
        plan: sub.plan,
        currentPeriodStart: sub.current_period_start,
        currentPeriodEnd: sub.current_period_end,
        status: sub.status
      },
    });
  } catch (error: any) {
    console.error('Update subscription error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/billing/subscription/:id/cancel
// @desc    Cancel subscription
// @access  Private
router.post('/subscription/:id/cancel', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const subscriptionId = req.params.id;

    const { rows: subRows } = await pool.query(
      "SELECT * FROM subscriptions WHERE user_id = $1 AND status IN ('active', 'trialing') LIMIT 1",
      [userId]
    );

    if (subRows.length === 0) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    const subscription = subRows[0];

    // Cancel subscription in Stripe
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    const { rows: updatedRows } = await pool.query(
      'UPDATE subscriptions SET cancel_at_period_end = true, updated_at = NOW() WHERE id = $1 RETURNING *',
      [subscription.id]
    );

    const sub = updatedRows[0];
    res.json({
      message: 'Subscription will be cancelled at the end of the current period',
      subscription: {
        id: sub.id,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        status: sub.status
      },
    });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/billing/subscription/:id/reactivate
// @desc    Reactivate cancelled subscription
// @access  Private
router.post('/subscription/:id/reactivate', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const subscriptionId = req.params.id;

    const { rows: subRows } = await pool.query(
      subscriptionId && subscriptionId !== 'current' && subscriptionId !== ':id'
        ? "SELECT * FROM subscriptions WHERE id = $1 AND user_id = $2" 
        : "SELECT * FROM subscriptions WHERE user_id = $1 AND status IN ('active', 'trialing') AND cancel_at_period_end = true LIMIT 1",
      subscriptionId && subscriptionId !== 'current' && subscriptionId !== ':id' ? [subscriptionId, userId] : [userId]
    );

    if (subRows.length === 0) {
      return res.status(404).json({ message: 'No cancelled subscription found' });
    }

    const subscription = subRows[0];

    // Reactivate subscription in Stripe
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    const { rows: updatedRows } = await pool.query(
      'UPDATE subscriptions SET cancel_at_period_end = false, updated_at = NOW() WHERE id = $1 RETURNING *',
      [subscription.id]
    );

    const sub = updatedRows[0];
    res.json({
      message: 'Subscription reactivated successfully',
      subscription: {
        id: sub.id,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        status: sub.status
      },
    });
  } catch (error: any) {
    console.error('Reactivate subscription error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/billing/payment-methods
// @desc    Add payment method
// @access  Private
router.post('/payment-methods', authenticateToken as any, validatePaymentMethod, async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentMethodId } = req.body;
    const userId = req.user.id;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const stripeCustomerId = user.metadata?.stripeCustomerId;
    if (!stripeCustomerId) {
      return res.status(400).json({ message: 'No Stripe customer found' });
    }

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: stripeCustomerId,
    });

    // Set as default payment method
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    res.json({
      message: 'Payment method added successfully',
    });
  } catch (error: any) {
    console.error('Add payment method error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/billing/payment-methods/:paymentMethodId/default
// @desc    Set default payment method
// @access  Private
router.post('/payment-methods/:paymentMethodId/default', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { paymentMethodId } = req.params;
    const userId = req.user.id;

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const stripeCustomerId = user.metadata?.stripeCustomerId;
    if (!stripeCustomerId) {
      return res.status(404).json({ message: 'No Stripe customer found' });
    }

    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    await UserModel.findByIdAndUpdate(userId, { defaultPaymentMethodId: paymentMethodId });

    res.json({ message: 'Default payment method updated' });
  } catch (error: any) {
    console.error('Set default payment method error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/billing/payment-methods
// @desc    Get payment methods
// @access  Private
router.get('/payment-methods', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const stripeCustomerId = user.metadata?.stripeCustomerId;
    if (!stripeCustomerId) {
      return res.json({ paymentMethods: [] });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card',
    });

    res.json({
      paymentMethods: paymentMethods.data.map((pm: any) => ({
        id: pm.id,
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
        isDefault: pm.id === user.metadata?.defaultPaymentMethodId,
      })),
    });
  } catch (error: any) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/billing/payment-methods/:paymentMethodId
// @desc    Remove payment method
// @access  Private
router.delete('/payment-methods/:paymentMethodId', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { paymentMethodId } = req.params;
    const userId = req.user.id;

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const stripeCustomerId = user.metadata?.stripeCustomerId;
    if (!stripeCustomerId) {
      return res.status(404).json({ message: 'No Stripe customer found' });
    }

    // Detach payment method
    await stripe.paymentMethods.detach(paymentMethodId);

    res.json({
      message: 'Payment method removed successfully',
    });
  } catch (error: any) {
    console.error('Remove payment method error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/billing/invoices
// @desc    Get invoices
// @access  Private
router.get('/invoices', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const stripeCustomerId = user.metadata?.stripeCustomerId;
    if (!stripeCustomerId) {
      return res.json({ invoices: [] });
    }

    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: parseInt(limit as string),
    });

    res.json({
      invoices: invoices.data.map((invoice: any) => ({
        id: invoice.id,
        number: invoice.number,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        date: new Date(invoice.created * 1000),
        pdf: invoice.invoice_pdf,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
      })),
    });
  } catch (error: any) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/billing/apply-coupon
// @desc    Apply coupon to active subscription
// @access  Private
router.post('/apply-coupon', authenticateToken as any, [ body('coupon').notEmpty() ], async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { coupon } = req.body;

    const { rows: subRows } = await pool.query(
      "SELECT * FROM subscriptions WHERE user_id = $1 AND status IN ('active', 'trialing') LIMIT 1",
      [userId]
    );

    if (subRows.length === 0) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    const subscription = subRows[0];

    // Validate coupon exists
    await stripe.coupons.retrieve(coupon);

    const updated = await stripe.subscriptions.update(subscription.stripe_subscription_id, { coupon });
    
    const { rows: updatedRows } = await pool.query(
      'UPDATE subscriptions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [updated.status, subscription.id]
    );

    const sub = updatedRows[0];
    res.json({ 
        message: 'Coupon applied', 
        subscription: {
            id: sub.id,
            status: sub.status,
            plan: sub.plan
        } 
    });
  } catch (error: any) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/billing/plans
// @desc    Get available plans
// @access  Public
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = await stripe.plans.list({
      active: true,
      expand: ['data.product'],
    });

    const formattedPlans = plans.data.map((plan: any) => ({
      id: plan.id,
      name: plan.nickname,
      price: plan.amount / 100,
      currency: plan.currency,
      interval: plan.interval,
      intervalCount: plan.interval_count,
      product: {
        id: plan.product.id,
        name: plan.product.name,
        description: plan.product.description,
        features: plan.product.metadata.features ? 
          plan.product.metadata.features.split(',') : [],
      },
    }));

    res.json({ plans: formattedPlans });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/billing/webhook
// @desc    Handle Stripe webhooks
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  let event: any;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Webhook handlers
async function handleSubscriptionCreated(subscription: any) {
  try {
    const { rows } = await pool.query(
      'SELECT id FROM subscriptions WHERE stripe_subscription_id = $1',
      [subscription.id]
    );

    if (rows.length > 0) {
      await pool.query(
        `UPDATE subscriptions SET 
           status = $1,
           current_period_start = $2,
           current_period_end = $3,
           updated_at = NOW()
         WHERE stripe_subscription_id = $4`,
        [
          subscription.status,
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000),
          subscription.id
        ]
      );
    }
  } catch (error) {
    console.error('Handle subscription created error:', error);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    await pool.query(
      `UPDATE subscriptions SET 
         status = $1,
         current_period_start = $2,
         current_period_end = $3,
         cancel_at_period_end = $4,
         updated_at = NOW()
       WHERE stripe_subscription_id = $5`,
      [
        subscription.status,
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
        subscription.cancel_at_period_end,
        subscription.id
      ]
    );
  } catch (error) {
    console.error('Handle subscription updated error:', error);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    await pool.query(
      `UPDATE subscriptions SET 
         status = 'cancelled',
         cancelled_at = NOW(),
         updated_at = NOW()
       WHERE stripe_subscription_id = $1`,
      [subscription.id]
    );
  } catch (error) {
    console.error('Handle subscription deleted error:', error);
  }
}

async function handlePaymentSucceeded(invoice: any) {
  try {
    const { rows } = await pool.query(
      'SELECT s.*, u.email, u.first_name FROM subscriptions s JOIN users u ON s.user_id = u.id WHERE s.stripe_subscription_id = $1',
      [invoice.subscription]
    );

    if (rows.length > 0) {
      const sub = rows[0];
      // Send confirmation email
      await emailService.sendEmail({
        to: sub.email,
        subject: 'Payment Successful',
        template: 'payment-success',
        data: {
          name: sub.first_name,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          planName: sub.plan.name,
        },
      });
    }
  } catch (error) {
    console.error('Handle payment succeeded error:', error);
  }
}

async function handlePaymentFailed(invoice: any) {
  try {
    const { rows } = await pool.query(
      'SELECT s.*, u.email, u.first_name FROM subscriptions s JOIN users u ON s.user_id = u.id WHERE s.stripe_subscription_id = $1',
      [invoice.subscription]
    );

    if (rows.length > 0) {
      const sub = rows[0];
      // Send payment failed email
      await emailService.sendEmail({
        to: sub.email,
        subject: 'Payment Failed',
        template: 'payment-failed',
        data: {
          name: sub.first_name,
          amount: invoice.amount_due / 100,
          currency: invoice.currency,
          planName: sub.plan.name,
          retryDate: new Date(invoice.next_payment_attempt * 1000),
        },
      });
    }
  } catch (error) {
    console.error('Handle payment failed error:', error);
  }
}

export default router;
