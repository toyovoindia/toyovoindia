import env from './config/env.js';
import app from './app.js';
import { connectDB } from './config/db.js';
import logger from './utils/logger.js';
import { startCronJobs } from './services/cron.service.js';

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(`${err.name}: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

// Connect to Database and start server
let server;

const bootstrap = async () => {
  try {
    await connectDB();
    server = app.listen(env.PORT, () => {
      logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      startCronJobs();
    });
  } catch (error) {
    logger.error(`Failed to bootstrap server: ${error.message}`);
    process.exit(1);
  }
};

bootstrap();

// Handle Unhandled Rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...');
  logger.error(`${err.name}: ${err.message}`);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful Shutdown on SIGTERM/SIGINT
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, shutting down gracefully...');
  if (server) {
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
