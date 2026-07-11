import Order from '../models/Order.js';
import logger from '../utils/logger.js';
import { revertFulfilledOrderSideEffects } from './order.service.js';

const cancelAbandonedCheckouts = async () => {
  try {
    // Find orders that are older than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const abandonedOrders = await Order.find({
      paymentStatus: 'pending',
      paymentMethod: { $in: ['payu', 'phonepe'] },
      status: 'pending',
      createdAt: { $lte: thirtyMinutesAgo }
    });

    if (abandonedOrders.length === 0) return;

    logger.info(`Found ${abandonedOrders.length} abandoned checkouts to cancel.`);

    for (const order of abandonedOrders) {
      order.status = 'cancelled';
      order.paymentStatus = 'failed';
      order.cancelledAt = new Date();
      order.notes = (order.notes ? order.notes + '\n' : '') + 'System Auto-Cancel: Payment abandoned by user.';

      order.statusHistory.push({
        status: 'cancelled',
        actorRole: 'system',
        note: 'Payment abandoned by customer (No webhook received within 30 minutes).',
        createdAt: new Date(),
      });

      await order.save();
      logger.info(`Cancelled abandoned order: ${order.orderNumber}`);
    }
  } catch (error) {
    logger.error(`Error running abandoned checkouts cron: ${error.message}`);
  }
};

// Start the cron service to run every 15 minutes
export const startCronJobs = () => {
  logger.info('Starting background cron jobs...');
  
  // Run immediately on startup
  cancelAbandonedCheckouts();

  // Run every 15 minutes (15 * 60 * 1000)
  setInterval(() => {
    cancelAbandonedCheckouts();
  }, 15 * 60 * 1000);
};
