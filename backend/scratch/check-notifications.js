import mongoose from 'mongoose';
import NotificationLog from '../src/models/NotificationLog.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
  
  const logs = await NotificationLog.find().sort({ createdAt: -1 }).limit(10);
  console.log('Latest 10 Notification Logs:');
  logs.forEach(log => {
    console.log(`- Title: ${log.title} | Status: ${log.status} | CreatedAt: ${log.createdAt}`);
  });
  
  await mongoose.disconnect();
}

run().catch(console.error);
