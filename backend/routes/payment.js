// backend/routes/payments.js
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const axios = require('axios'); // used for Paytm examples
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create Razorpay Order
 * client -> POST /api/create-order { amount, description }
 * response -> { id, amount, currency, receipt, key_id }
 */
router.post('/create-order', async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const options = {
      amount: Math.round(amount * 100), // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      description: description || 'ExpenseTracker top-up'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create order' });
  }
});

/**
 * Verify Razorpay payment signature
 * client -> POST /api/verify-payment { razorpay_order_id, razorpay_payment_id, razorpay_signature, metadata }
 * server verifies signature and returns success or failure
 */
router.post('/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, metadata } = req.body;
  const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generated_signature === razorpay_signature) {
    // At this point you can record the payment in your DB, send receipt, etc.
    return res.json({ success: true, paymentId: razorpay_payment_id, metadata });
  } else {
    return res.status(400).json({ success: false, error: 'Invalid signature' });
  }
});

/**
 * === Paytm example (conceptual) ===
 * Initiate transaction (server-side) -> call Paytm Initiate Transaction API to get txnToken
 * NOTE: Official Paytm integration needs checksum generation and their server SDK; check Paytm docs.
 * See Paytm docs for details: https://business.paytm.com/docs/all-in-one-sdk/ and checksum docs.
 */
router.post('/paytm/initiate', async (req, res) => {
  // This is a conceptual stub. For real Paytm integration use Paytm server SDK and checksum utility.
  // Implementation details vary and require MID and merchant key.
  return res.status(501).json({ error: 'Paytm initiation not implemented here. Use Paytm server SDK and checksum.' });
});

module.exports = router;
