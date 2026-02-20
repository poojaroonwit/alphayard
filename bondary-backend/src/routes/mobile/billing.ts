import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../../lib/prisma';
import { UserModel } from '../../models/UserModel';
import { authenticateToken } from '../../middleware/auth';

// Import sub-routers
import billingSubscriptions from './billingSubscriptions';
import billingPaymentMethods from './billingPaymentMethods';
import billingWebhooks from './billingWebhooks';

const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Mount sub-routers
router.use('/subscription', billingSubscriptions);
router.use('/payment-methods', billingPaymentMethods);
router.use('/webhook', billingWebhooks);

// =============================================
// INVOICES
// =============================================

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

// =============================================
// COUPONS
// =============================================

// @route   POST /api/billing/apply-coupon
// @desc    Apply coupon to active subscription
// @access  Private
router.post('/apply-coupon', authenticateToken as any, [ body('coupon').notEmpty() ], async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const { coupon } = req.body;

        const subRows = await prisma.$queryRaw<any[]>`
            SELECT * FROM core.subscriptions WHERE user_id = ${userId} AND status IN ('active', 'trialing') LIMIT 1
        `;

        if (subRows.length === 0) {
            return res.status(404).json({ message: 'No active subscription found' });
        }

        const subscription = subRows[0];

        // Validate coupon exists
        await stripe.coupons.retrieve(coupon);

        const updated = await stripe.subscriptions.update(subscription.stripe_subscription_id, { coupon });
        
        const updatedRows = await prisma.$queryRaw<any[]>`
            UPDATE core.subscriptions SET status = ${updated.status}, updated_at = NOW() WHERE id = ${subscription.id} RETURNING *
        `;

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

// =============================================
// PLANS
// =============================================

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

export default router;
