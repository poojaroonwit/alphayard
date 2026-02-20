import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { UserModel } from '../../models/UserModel';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Validation middleware
const validatePaymentMethod = [
    body('paymentMethodId').notEmpty(),
];

// @route   POST /api/billing/payment-methods
// @desc    Add payment method
// @access  Private
router.post('/', authenticateToken as any, validatePaymentMethod, async (req: any, res: Response) => {
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

        res.json({ message: 'Payment method added successfully' });
    } catch (error: any) {
        console.error('Add payment method error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/billing/payment-methods/:paymentMethodId/default
// @desc    Set default payment method
// @access  Private
router.post('/:paymentMethodId/default', authenticateToken as any, async (req: any, res: Response) => {
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
router.get('/', authenticateToken as any, async (req: any, res: Response) => {
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
router.delete('/:paymentMethodId', authenticateToken as any, async (req: any, res: Response) => {
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

        res.json({ message: 'Payment method removed successfully' });
    } catch (error: any) {
        console.error('Remove payment method error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
