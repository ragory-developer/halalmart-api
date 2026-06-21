import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { BadRequestError } from '../utils/errors';
import { asyncHandler } from '../utils/helpers';
import logger from '../utils/logger';
import { BaseController } from './BaseController';

/**
 * Mock payment controller.
 * Simulates payment processing without real gateway integration.
 */
export class PaymentController extends BaseController {
  processPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { orderId, paymentMethod, amount } = req.body;

    if (!orderId || !amount) {
      throw new BadRequestError('Order ID and amount are required');
    }

    logger.info('Processing mock payment', { orderId, paymentMethod, amount, userId: req.user!.userId });

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock: 95% success rate
    const success = Math.random() > 0.05;

    if (success) {
      res.json({
        success: true,
        data: {
          transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          status: 'SUCCESS',
          amount,
          paymentMethod: paymentMethod || 'CARD',
          paidAt: new Date().toISOString(),
        },
      });
    } else {
      res.status(402).json({
        success: false,
        message: 'Payment failed. Please try again.',
        data: { status: 'FAILED' },
      });
    }
  });
}
