import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { validateApiKey } from '../../middleware/auth';
import { prisma } from '../../lib/prisma';
import emailService from '../../services/emailService';
import smsService from '../../services/smsService';

const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Stripe webhook
router.post('/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  let event: any;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleStripeSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleStripeSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleStripeSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleStripePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleStripePaymentFailed(event.data.object);
        break;
      case 'customer.deleted':
        await handleStripeCustomerDeleted(event.data.object);
        break;
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Twilio webhook
router.post('/twilio', validateApiKey as any, async (req: Request, res: Response) => {
  try {
    const { From, To, Body, MessageSid } = req.body;

    // Handle incoming SMS
    await handleIncomingSMS({
      from: From,
      to: To,
      body: Body,
      messageId: MessageSid,
    });

    res.status(200).send();
  } catch (error) {
    console.error('Twilio webhook error:', error);
    res.status(500).send();
  }
});

// Firebase webhook
router.post('/firebase', validateApiKey as any, async (req: Request, res: Response) => {
  try {
    const { eventType, data } = req.body;

    switch (eventType) {
      case 'user.created':
        await handleFirebaseUserCreated(data);
        break;
      case 'user.deleted':
        await handleFirebaseUserDeleted(data);
        break;
      case 'user.updated':
        await handleFirebaseUserUpdated(data);
        break;
      default:
        console.log(`Unhandled Firebase event type: ${eventType}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Firebase webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Google webhook
router.post('/google', validateApiKey as any, async (req: Request, res: Response) => {
  try {
    const { eventType, data } = req.body;

    switch (eventType) {
      case 'calendar.event.created':
        await handleGoogleCalendarEvent(data);
        break;
      case 'drive.file.updated':
        await handleGoogleDriveFile(data);
        break;
      default:
        console.log(`Unhandled Google event type: ${eventType}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Google webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Apple webhook
router.post('/apple', validateApiKey as any, async (req: Request, res: Response) => {
  try {
    const { eventType, data } = req.body;

    switch (eventType) {
      case 'subscription.purchased':
        await handleAppleSubscriptionPurchased(data);
        break;
      case 'subscription.renewed':
        await handleAppleSubscriptionRenewed(data);
        break;
      case 'subscription.cancelled':
        await handleAppleSubscriptionCancelled(data);
        break;
      default:
        console.log(`Unhandled Apple event type: ${eventType}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Apple webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// AWS S3 webhook
router.post('/aws-s3', validateApiKey as any, async (req: Request, res: Response) => {
  try {
    const { eventType, data } = req.body;

    switch (eventType) {
      case 's3:ObjectCreated':
        await handleS3ObjectCreated(data);
        break;
      case 's3:ObjectRemoved':
        await handleS3ObjectRemoved(data);
        break;
      default:
        console.log(`Unhandled AWS S3 event type: ${eventType}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('AWS S3 webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Sentry webhook
router.post('/sentry', validateApiKey as any, async (req: Request, res: Response) => {
  try {
    const { event, project, url } = req.body;

    // Handle Sentry error alerts
    await handleSentryError({
      event,
      project,
      url,
    });

    res.json({ received: true });
  } catch (error) {
    console.error('Sentry webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Health check webhook
router.post('/health', validateApiKey as any, async (req: Request, res: Response) => {
  try {
    const { service, status, message, timestamp } = req.body;

    // Log health check
    console.log(`Health check from ${service}: ${status} - ${message}`);

    // Store health check data if needed
    // await HealthCheck.create({ service, status, message, timestamp });

    res.json({ received: true });
  } catch (error) {
    console.error('Health check webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// Stripe webhook handlers
async function handleStripeSubscriptionCreated(subscription: any) {
  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT id FROM core.subscriptions WHERE stripe_subscription_id = ${subscription.id}
    `;

    if (rows.length > 0) {
      await prisma.$executeRaw`
        UPDATE core.subscriptions SET 
           status = ${subscription.status},
           current_period_start = ${new Date(subscription.current_period_start * 1000)},
           current_period_end = ${new Date(subscription.current_period_end * 1000)},
           updated_at = NOW()
         WHERE stripe_subscription_id = ${subscription.id}
      `;
    }
  } catch (error) {
    console.error('Handle Stripe subscription created error:', error);
  }
}

async function handleStripeSubscriptionUpdated(subscription: any) {
  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT id FROM core.subscriptions WHERE stripe_subscription_id = ${subscription.id}
    `;

    if (rows.length > 0) {
      await prisma.$executeRaw`
        UPDATE core.subscriptions SET 
           status = ${subscription.status},
           current_period_start = ${new Date(subscription.current_period_start * 1000)},
           current_period_end = ${new Date(subscription.current_period_end * 1000)},
           cancel_at_period_end = ${subscription.cancel_at_period_end},
           updated_at = NOW()
         WHERE stripe_subscription_id = ${subscription.id}
      `;
    }
  } catch (error) {
    console.error('Handle Stripe subscription updated error:', error);
  }
}

async function handleStripeSubscriptionDeleted(subscription: any) {
  try {
    await prisma.$executeRaw`
      UPDATE core.subscriptions SET 
         status = 'cancelled',
         cancelled_at = NOW(),
         updated_at = NOW()
       WHERE stripe_subscription_id = ${subscription.id}
    `;
  } catch (error) {
    console.error('Handle Stripe subscription deleted error:', error);
  }
}

async function handleStripePaymentSucceeded(invoice: any) {
  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT s.*, u.email, u.first_name FROM core.subscriptions s JOIN core.users u ON s.user_id = u.id WHERE s.stripe_subscription_id = ${invoice.subscription}
    `;

    if (rows.length > 0) {
      const sub = rows[0];
      // Note: addBillingRecord would need to be moved to a service or direct query here
      // For now, we'll just send the email
      
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
    console.error('Handle Stripe payment succeeded error:', error);
  }
}

async function handleStripePaymentFailed(invoice: any) {
  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT s.*, u.email, u.first_name FROM core.subscriptions s JOIN core.users u ON s.user_id = u.id WHERE s.stripe_subscription_id = ${invoice.subscription}
    `;

    if (rows.length > 0) {
      const sub = rows[0];
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
    console.error('Handle Stripe payment failed error:', error);
  }
}

async function handleStripeCustomerDeleted(customer: any) {
  try {
    // Handle customer deletion
    console.log(`Stripe customer deleted: ${customer.id}`);
  } catch (error) {
    console.error('Handle Stripe customer deleted error:', error);
  }
}

// Twilio webhook handlers
async function handleIncomingSMS(data: any) {
  try {
    // Handle incoming SMS messages
    console.log('Incoming SMS:', data);

    // You can implement SMS-based commands here
    // For example: emergency alerts, location requests, etc.
  } catch (error) {
    console.error('Handle incoming SMS error:', error);
  }
}

// Firebase webhook handlers
async function handleFirebaseUserCreated(data: any) {
  try {
    console.log('Firebase user created:', data);
  } catch (error) {
    console.error('Handle Firebase user created error:', error);
  }
}

async function handleFirebaseUserDeleted(data: any) {
  try {
    console.log('Firebase user deleted:', data);
  } catch (error) {
    console.error('Handle Firebase user deleted error:', error);
  }
}

async function handleFirebaseUserUpdated(data: any) {
  try {
    console.log('Firebase user updated:', data);
  } catch (error) {
    console.error('Handle Firebase user updated error:', error);
  }
}

// Google webhook handlers
async function handleGoogleCalendarEvent(data: any) {
  try {
    console.log('Google calendar event:', data);
  } catch (error) {
    console.error('Handle Google calendar event error:', error);
  }
}

async function handleGoogleDriveFile(data: any) {
  try {
    console.log('Google Drive file:', data);
  } catch (error) {
    console.error('Handle Google Drive file error:', error);
  }
}

// Apple webhook handlers
async function handleAppleSubscriptionPurchased(data: any) {
  try {
    console.log('Apple subscription purchased:', data);
  } catch (error) {
    console.error('Handle Apple subscription purchased error:', error);
  }
}

async function handleAppleSubscriptionRenewed(data: any) {
  try {
    console.log('Apple subscription renewed:', data);
  } catch (error) {
    console.error('Handle Apple subscription renewed error:', error);
  }
}

async function handleAppleSubscriptionCancelled(data: any) {
  try {
    console.log('Apple subscription cancelled:', data);
  } catch (error) {
    console.error('Handle Apple subscription cancelled error:', error);
  }
}

// AWS S3 webhook handlers
async function handleS3ObjectCreated(data: any) {
  try {
    console.log('S3 object created:', data);
  } catch (error) {
    console.error('Handle S3 object created error:', error);
  }
}

async function handleS3ObjectRemoved(data: any) {
  try {
    console.log('S3 object removed:', data);
  } catch (error) {
    console.error('Handle S3 object removed error:', error);
  }
}

// Sentry webhook handlers
async function handleSentryError(data: any) {
  try {
    console.log('Sentry error:', data);
    
    // You can implement error alerting here
    // For example: send notifications to admins, log to database, etc.
  } catch (error) {
    console.error('Handle Sentry error error:', error);
  }
}

export default router;
