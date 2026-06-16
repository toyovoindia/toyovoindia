import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from './config/db.js';
import SiteConfig from './models/SiteConfig.js';
import mongoose from 'mongoose';

const check = async () => {
  try {
    await connectDB();
    const config = await SiteConfig.findOne({ key: 'default' });
    console.log('--- SiteConfig Document ---');
    console.log(JSON.stringify(config, null, 2));
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
};

check();
