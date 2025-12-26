import asyncHandler from '../middleware/asyncHandler.js';
import Order from '../models/orderModel.js';
import { getEsewaSignature } from '../utils/esewa.js';
import crypto from 'crypto';

// @desc    Get eSewa Config & Signature
// @route   POST /api/esewa/initiate
// @access  Private
const initiateEsewaPayment = asyncHandler(async (req, res) => {
  const { orderId, amount } = req.body;

  if (!orderId || !amount) {
    res.status(400);
    throw new Error('Order ID and Amount required');
  }

  // 1. DETERMINE THE BASE URL
  // In your .env file on the server, set FRONTEND_URL=https://nevanhandicraft.com
  // If not set, it defaults to localhost for development.
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  // eSewa Config
  // NOTE: For Real Production, change 'EPAYTEST' to your real Merchant ID provided by eSewa
  const productCode = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
  const transactionUuid = `${orderId}_${Date.now()}`;
  const totalAmount = amount;

  // Signature Format
  const signatureString = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;

  const signature = getEsewaSignature(signatureString);

  res.json({
    signature,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
    transaction_uuid: transactionUuid,
    product_code: productCode,
    total_amount: totalAmount,
    // 2. USE THE DYNAMIC URL HERE
    success_url: `${baseUrl}/payment/esewa/success`,
    failure_url: `${baseUrl}/payment/esewa/failure`,
  });
});

// @desc    Verify eSewa Payment
// @route   POST /api/esewa/verify
// @access  Private
const verifyEsewaPayment = asyncHandler(async (req, res) => {
  const { encodedData } = req.body;

  if (!encodedData) {
    res.status(400);
    throw new Error('No data received');
  }

  // 1. Decode the Base64 response from eSewa
  let decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');
  decodedData = JSON.parse(decodedData);

  if (decodedData.status !== 'COMPLETE') {
    res.status(400);
    throw new Error('Transaction not complete');
  }

  // 2. Re-generate signature to verify data integrity
  const message = `transaction_code=${decodedData.transaction_code},status=${decodedData.status},total_amount=${decodedData.total_amount},transaction_uuid=${decodedData.transaction_uuid},product_code=${decodedData.product_code},signed_field_names=${decodedData.signed_field_names}`;

  const calculatedSignature = getEsewaSignature(message);

  if (calculatedSignature !== decodedData.signature) {
    res.status(400);
    throw new Error('Integrity error: Signature mismatch');
  }

  // 3. Extract Order ID
  const orderId = decodedData.transaction_uuid.split('_')[0];

  const order = await Order.findById(orderId);

  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: decodedData.transaction_code,
      status: decodedData.status,
      update_time: Date.now(),
      email_address: '',
    };

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

export { initiateEsewaPayment, verifyEsewaPayment };
