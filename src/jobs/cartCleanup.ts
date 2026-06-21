import cron from 'node-cron';
import prisma from '../config/database';
import logger from '../utils/logger';

// Run cleanup every hour at the top of the hour (e.g. 1:00, 2:00)
const cartCleanupJob = cron.schedule('0 * * * *', async () => {
  try {
    logger.info('Running Abandoned Cart Cleanup Job...');
    
    // Fetch the setting or default to 24 hours
    const setting = await prisma.setting.findUnique({
      where: { key: 'abandoned_cart_expiry_hours' }
    });
    
    const expiryHours = setting?.value ? parseInt(setting.value, 10) : 24;
    
    if (isNaN(expiryHours) || expiryHours <= 0) {
      logger.info('Abandoned Cart Cleanup is disabled or invalid setting (hours <= 0).');
      return;
    }

    const cutoffTime = new Date(Date.now() - expiryHours * 60 * 60 * 1000);

    const result = await prisma.cart.deleteMany({
      where: {
        updatedAt: {
          lt: cutoffTime
        }
      }
    });

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} abandoned cart(s) older than ${expiryHours} hours.`);
    } else {
      logger.info('No abandoned carts found for cleanup.');
    }
  } catch (error) {
    logger.error('Error during Abandoned Cart Cleanup:', error);
  }
});

export default cartCleanupJob;
