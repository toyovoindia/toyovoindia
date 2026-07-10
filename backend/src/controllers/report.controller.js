import asyncHandler from '../utils/asyncHandler.js';
import Order from '../models/Order.js';
import { formatTransactionRow } from '../utils/reportMapper.js';
import { arrayToCsv } from '../utils/csvExport.js';

/**
 * @desc    Export detailed order/transaction logs as CSV
 * @route   GET /api/admin/reports/transactions/export
 * @access  Private/Admin
 */
export const exportTransactionLogs = asyncHandler(async (req, res) => {
  // We can add date filters from query params later if needed
  // For now, it fetches all orders
  const orders = await Order.find()
    .select('-__v')
    .sort({ createdAt: -1 })
    .lean(); // Fetch fast, lean objects

  if (!orders || orders.length === 0) {
    return res.status(404).json({ message: 'No transactions found to export' });
  }

  // 1. Run all orders through the exact 85-column mapper
  const mappedData = orders.map(order => formatTransactionRow(order));

  // 2. Convert standard objects to CSV String safely
  const csvString = arrayToCsv(mappedData);

  // 3. Force browser to download as CSV file
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="transaction_report_${Date.now()}.csv"`);
  
  return res.status(200).send(csvString);
});
