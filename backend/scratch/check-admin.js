import dotenv from 'dotenv';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';

dotenv.config();

const check = async () => {
  await connectDB();
  const user = await User.findOne({ email: 'toyovoindia@gmail.com' });
  console.log('Admin user document from MongoDB:', JSON.stringify(user, null, 2));
  process.exit(0);
};

check().catch(console.error);
