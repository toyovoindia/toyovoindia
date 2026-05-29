import mongoose from 'mongoose';
import Product from './src/models/Product.js';
import env from './src/config/env.js';
import { connectDB } from './src/config/db.js';

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const run = async () => {
  await connectDB();
  const sizes = ['Small'];
  const filter = {
    size: { $in: sizes.map(s => new RegExp('^' + escapeRegExp(s) + '$', 'i')) }
  };
  console.log("Filter:", JSON.stringify(filter));
  const count = await Product.countDocuments(filter);
  const products = await Product.find(filter).select('name size').lean();
  console.log("Count:", count);
  console.log("Products:", products);
  process.exit(0);
};

run();
