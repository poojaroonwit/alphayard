import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../../lib/prisma';
import { UserModel } from '../../models/UserModel';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Validation middleware
const validateSubscription = [
    body('planId').notEmpty(),
    body('paymentMethodId').optional().notEmpty(),
];

// @route   POST /api/billing/subscription
// @desc    Create new subscription
// @access  Private
router.post('/', authenticateToken as any, validateSubscription, async (req: any, res: Response) => {
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
        const existingSubs = await prisma.$queryRaw<any[]>`
            SELECT id FROM core.subscriptions WHERE user_id = ${userId} AND status IN ('active', 'trialing')
        `;

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
                metadata: { userId: user.id.toString() },
            });

            stripeCustomerId = customer.id;
            await UserModel.findByIdAndUpdate(userId, { stripeCustomerId });
        }

        // Attach payment method if provided
        if (paymentMethodId) {
            await stripe.paymentMethods.attach(paymentMethodId, {
                customer: stripeCustomerId,
            });

            await stripe.customers.update(stripeCustomerId, {
                invoice_settings: { default_payment_method: paymentMethodId },
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
        const subRows = await prisma.$queryRawUnsafe<any[]>(
            `INSERT INTO core.subscriptions (
                user_id, circle_id, stripe_subscription_id, stripe_customer_id, 
                plan, status, current_period_start, current_period_end, cancel_at_period_end
            ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9) RETURNING *`,
            userId,
            circleId || (user.circleIds && user.circleIds[0]) || null,
            subscription.id,
            stripeCustomerId,
            JSON.stringify({
                id: plan.id,
                name: plan.nickname,
                price: plan.amount / 100,
                currency: plan.currency,
                interval: plan.interval,
                intervalCount: plan.interval_count,
            }),
            subscription.status,
            new Date(subscription.current_period_start * 1000),
            new Date(subscription.current_period_end * 1000),
            subscription.cancel_at_period_end
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
router.get('/', authenticateToken as any, async (req: any, res: Response) => {
    try {
        const userId = req.user.id;

        const rows = await prisma.$queryRaw<any[]>`
            SELECT s.*, c.data->>'name' as circle_name
             FROM core.subscriptions s
             LEFT JOIN unified_entities c ON s.circle_id = c.id
             WHERE s.user_id = ${userId} AND s.status IN ('active', 'trialing', 'past_due')
             LIMIT 1
        `;

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
router.put('/:id?', authenticateToken as any, [
    body('planId').notEmpty(),
], async (req: any, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { planId, seats } = req.body;
        const userId = req.user.id;

        const subRows = await prisma.$queryRaw<any[]>`
            SELECT * FROM core.subscriptions WHERE user_id = ${userId} AND status IN ('active', 'trialing') LIMIT 1
        `;

        if (subRows.length === 0) {
            return res.status(404).json({ message: 'No active subscription found' });
        }

        const subscription = subRows[0];

        // Update subscription in Stripe
        const current = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
        const itemId = current.items.data[0]?.id;
        const updatedSubscription = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            items: [ itemId 
                ? { id: itemId, price: planId, quantity: seats ? Math.max(1, Number(seats)) : current.items.data[0]?.quantity || 1 } 
                : { price: planId, quantity: seats ? Math.max(1, Number(seats)) : 1 } 
            ],
            proration_behavior: 'create_prorations',
            metadata: {
                ...(current.metadata || {}),
                seats: String(seats ? Math.max(1, Number(seats)) : (current.metadata?.seats || current.items.data[0]?.quantity || 1)),
            }
        });

        const plan = await stripe.plans.retrieve(planId);
        const planData = {
            id: plan.id,
            name: plan.nickname,
            price: plan.amount / 100,
            currency: plan.currency,
            interval: plan.interval,
            intervalCount: plan.interval_count,
        };

        const updatedRows = await prisma.$queryRawUnsafe<any[]>(
            `UPDATE core.subscriptions SET 
               plan = $1::jsonb,
               current_period_start = $2,
               current_period_end = $3,
               updated_at = NOW()
             WHERE id = $4 RETURNING *`,
            JSON.stringify(planData),
            new Date(updatedSubscription.current_period_start * 1000),
            new Date(updatedSubscription.current_period_end * 1000),
            subscription.id
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
router.post('/:id/cancel', authenticateToken as any, async (req: any, res: Response) => {
    try {
        const userId = req.user.id;

        const subRows = await prisma.$queryRaw<any[]>`
            SELECT * FROM core.subscriptions WHERE user_id = ${userId} AND status IN ('active', 'trialing') LIMIT 1
        `;

        if (subRows.length === 0) {
            return res.status(404).json({ message: 'No active subscription found' });
        }

        const subscription = subRows[0];

        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: true,
        });

        const updatedRows = await prisma.$queryRaw<any[]>`
            UPDATE core.subscriptions SET cancel_at_period_end = true, updated_at = NOW() WHERE id = ${subscription.id} RETURNING *
        `;

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
router.post('/:id/reactivate', authenticateToken as any, async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const subscriptionId = req.params.id;

        let subRows: any[];
        if (subscriptionId && subscriptionId !== 'current' && subscriptionId !== ':id') {
            subRows = await prisma.$queryRaw<any[]>`
                SELECT * FROM core.subscriptions WHERE id = ${subscriptionId} AND user_id = ${userId}
            `;
        } else {
            subRows = await prisma.$queryRaw<any[]>`
                SELECT * FROM core.subscriptions WHERE user_id = ${userId} AND status IN ('active', 'trialing') AND cancel_at_period_end = true LIMIT 1
            `;
        }

        if (subRows.length === 0) {
            return res.status(404).json({ message: 'No cancelled subscription found' });
        }

        const subscription = subRows[0];

        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: false,
        });

        const updatedRows = await prisma.$queryRaw<any[]>`
            UPDATE core.subscriptions SET cancel_at_period_end = false, updated_at = NOW() WHERE id = ${subscription.id} RETURNING *
        `;

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

export default router;
