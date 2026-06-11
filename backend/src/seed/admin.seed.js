import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import { connectDB } from '../config/db.js';
import logger from '../utils/logger.js';
import User from '../models/User.js';

dotenv.config();

const requiredEnvKeys = [
  'MONGO_URI',
  'ADMIN_SEED_FIRST_NAME',
  'ADMIN_SEED_LAST_NAME',
  'ADMIN_SEED_EMAIL',
  'ADMIN_SEED_PASSWORD',
];

const ensureEnv = () => {
  const missing = requiredEnvKeys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required admin seed env values: ${missing.join(', ')}`);
  }
};

const seedAdmin = async () => {
  ensureEnv();
  await connectDB();

  const email = process.env.ADMIN_SEED_EMAIL.trim().toLowerCase();
  const role = process.env.ADMIN_SEED_ROLE || 'super_admin';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(process.env.ADMIN_SEED_PASSWORD, salt);

  const phone = (process.env.ADMIN_SEED_PHONE || '+917901931534').trim();

  const payload = {
    firstName: process.env.ADMIN_SEED_FIRST_NAME.trim(),
    lastName: process.env.ADMIN_SEED_LAST_NAME.trim(),
    email,
    phone,
    phoneVerified: true,
    passwordHash,
    role,
    status: 'Active',
    emailVerified: true,
  };

  const existingUser = await User.findOne({ email });

  if (!existingUser) {
    await User.create(payload);
    logger.info(`Admin seed completed. Created ${role} account for ${email} with phone ${phone}.`);
    process.exit(0);
  }

  existingUser.firstName = payload.firstName;
  existingUser.lastName = payload.lastName;
  existingUser.passwordHash = payload.passwordHash;
  existingUser.role = payload.role;
  existingUser.status = payload.status;
  existingUser.emailVerified = true;
  existingUser.phone = payload.phone;
  existingUser.phoneVerified = true;
  await existingUser.save();

  logger.info(`Admin seed completed. Updated ${role} account for ${email}.`);
  process.exit(0);
};

seedAdmin().catch((error) => {
  logger.error(`Admin seed failed: ${error.message}`);
  logger.error(error.stack);
  process.exit(1);
});
