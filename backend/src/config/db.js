import mongoose from 'mongoose';
import env from './env.js';
import logger from '../utils/logger.js';

export const connectDB = async () => {
  if (env.NODE_ENV === 'test') {
    return;
  } 
  
  try {
    if (env.NODE_ENV === 'development') {
      mongoose.set('debug', true);
    }
    const conn = await mongoose.connect(env.MONGO_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};
