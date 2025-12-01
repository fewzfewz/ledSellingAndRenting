const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const chapaService = require('../services/chapaService');
const telebirrService = require('../services/telebirrService');

const router = express.Router();

// Initialize payment with selected provider
router.post('/initialize', verifyToken, async (req, res) => {
  try {
    const { 
      amount, 
      currency = 'ETB', 
      provider = 'chapa', 
      rental_id, 
      order_id,
      customer_info = {}
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!['stripe', 'chapa', 'telebirr'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid payment provider' });
    }

    // Load current user details for provider payloads
    const userRes = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [req.user.userId]);
    const currentUser = userRes.rows[0] || {};

    // Generate unique transaction reference (must be < 50 chars)
    // UUID is 36 chars, Date.now() is 13 chars. Total > 50.
    // We'll use timestamp + short random string
    const tx_ref = `LED-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    let paymentResult;
    let paymentRecord;

    switch (provider) {
      case 'stripe':
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: currency.toLowerCase(),
          metadata: {
            user_id: req.user.userId,
            rental_id: rental_id || '',
            order_id: order_id || '',
            tx_ref
          }
        });

        paymentRecord = await pool.query(
          'INSERT INTO payments (user_id, rental_id, order_id, provider, provider_payment_id, amount, currency, status, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
          [req.user.userId, rental_id || null, order_id || null, 'stripe', paymentIntent.id, amount, currency, 'pending', JSON.stringify({ tx_ref })]
        );

        paymentResult = {
          provider: 'stripe',
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          tx_ref
        };
        break;

      case 'chapa':
        const chapaResult = await chapaService.initializePayment({
          amount,
          currency,
          email: customer_info.email || currentUser.email,
          first_name: customer_info.first_name || (currentUser.name ? currentUser.name.split(' ')[0] : 'Customer'),
          last_name: customer_info.last_name || (currentUser.name && currentUser.name.split(' ')[1] ? currentUser.name.split(' ')[1] : ''),
          tx_ref,
          callback_url: `${process.env.BACKEND_URL}/api/payments/chapa/callback`,
          return_url: `${process.env.FRONTEND_URL}/payment/success?tx_ref=${tx_ref}`,
          customization: {
            title: 'GraceLED Pay', // Max 16 chars
            description: rental_id ? 'Rental Payment' : 'Purchase Payment'
          }
        });

        if (!chapaResult.success) {
          return res.status(400).json({ error: chapaResult.error });
        }

        paymentRecord = await pool.query(
          'INSERT INTO payments (user_id, rental_id, order_id, provider, provider_payment_id, amount, currency, status, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
          [req.user.userId, rental_id || null, order_id || null, 'chapa', tx_ref, amount, currency, 'pending', JSON.stringify(chapaResult.data)]
        );

        paymentResult = {
          provider: 'chapa',
          checkout_url: chapaResult.checkout_url,
          tx_ref
        };
        break;

      case 'telebirr':
        const telebirrResult = await telebirrService.initializePayment({
          amount,
          outTradeNo: tx_ref,
          subject: rental_id ? 'LED Screen Rental' : 'LED Screen Purchase',
          totalAmount: amount,
          userId: req.user.userId
        });

        if (!telebirrResult.success) {
          return res.status(400).json({ error: telebirrResult.error });
        }

        paymentRecord = await pool.query(
          'INSERT INTO payments (user_id, rental_id, order_id, provider, provider_payment_id, amount, currency, status, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
          [req.user.userId, rental_id || null, order_id || null, 'telebirr', tx_ref, amount, currency, 'pending', JSON.stringify(telebirrResult.data)]
        );

        paymentResult = {
          provider: 'telebirr',
          checkout_url: telebirrResult.checkout_url,
          prepay_id: telebirrResult.prepay_id,
          tx_ref
        };
        break;
    }

    res.json({
      success: true,
      payment_id: paymentRecord.rows[0].id,
      ...paymentResult
    });
  } catch (err) {
    console.error('Payment initialization error:', err);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
});

// Verify payment status
router.get('/verify/:tx_ref', verifyToken, async (req, res) => {
  try {
    const { tx_ref } = req.params;

    const paymentRecord = await pool.query(
      'SELECT * FROM payments WHERE provider_payment_id = $1 OR metadata::text LIKE $2',
      [tx_ref, `%${tx_ref}%`]
    );

    if (paymentRecord.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentRecord.rows[0];
    let verificationResult;

    switch (payment.provider) {
      case 'chapa':
        verificationResult = await chapaService.verifyPayment(tx_ref);
        
        if (verificationResult.success && verificationResult.status === 'success') {
          await pool.query(
            'UPDATE payments SET status = $1, metadata = $2 WHERE id = $3',
            ['succeeded', JSON.stringify(verificationResult.data), payment.id]
          );

          // Update rental or order status
          if (payment.rental_id) {
            await pool.query("UPDATE rentals SET status = 'confirmed' WHERE id = $1", [payment.rental_id]);
          }
          if (payment.order_id) {
            await pool.query("UPDATE sales_orders SET status = 'paid' WHERE id = $1", [payment.order_id]);
          }
        }
        break;

      case 'telebirr':
        verificationResult = await telebirrService.verifyPayment(tx_ref);
        
        if (verificationResult.success && verificationResult.status === 'SUCCESS') {
          await pool.query(
            'UPDATE payments SET status = $1, metadata = $2 WHERE id = $3',
            ['succeeded', JSON.stringify(verificationResult.data), payment.id]
          );

          if (payment.rental_id) {
            await pool.query("UPDATE rentals SET status = 'confirmed' WHERE id = $1", [payment.rental_id]);
          }
          if (payment.order_id) {
            await pool.query("UPDATE sales_orders SET status = 'paid' WHERE id = $1", [payment.order_id]);
          }
        }
        break;

      case 'stripe':
        const paymentIntent = await stripe.paymentIntents.retrieve(payment.provider_payment_id);
        verificationResult = {
          success: true,
          status: paymentIntent.status,
          data: paymentIntent
        };
        break;
    }

    res.json({
      success: true,
      payment_status: payment.status,
      verification: verificationResult
    });
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Chapa webhook callback
router.post('/chapa/callback', async (req, res) => {
  try {
    const { tx_ref, status, reference } = req.body;

    const paymentRecord = await pool.query(
      'SELECT * FROM payments WHERE provider_payment_id = $1',
      [tx_ref]
    );

    if (paymentRecord.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentRecord.rows[0];

    if (status === 'success') {
      await pool.query(
        'UPDATE payments SET status = $1, metadata = $2 WHERE id = $3',
        ['succeeded', JSON.stringify(req.body), payment.id]
      );

      if (payment.rental_id) {
        await pool.query("UPDATE rentals SET status = 'confirmed' WHERE id = $1", [payment.rental_id]);
      }
      if (payment.order_id) {
        await pool.query("UPDATE sales_orders SET status = 'paid' WHERE id = $1", [payment.order_id]);
      }
    } else {
      await pool.query(
        'UPDATE payments SET status = $1 WHERE id = $2',
        ['failed', payment.id]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Chapa callback error:', err);
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

// Telebirr webhook callback
router.post('/telebirr/callback', async (req, res) => {
  try {
    const { out_trade_no, trade_status, sign } = req.body;

    // Verify signature
    const isValid = telebirrService.verifyWebhookSignature(req.body, sign);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const paymentRecord = await pool.query(
      'SELECT * FROM payments WHERE provider_payment_id = $1',
      [out_trade_no]
    );

    if (paymentRecord.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = paymentRecord.rows[0];

    if (trade_status === 'SUCCESS') {
      await pool.query(
        'UPDATE payments SET status = $1, metadata = $2 WHERE id = $3',
        ['succeeded', JSON.stringify(req.body), payment.id]
      );

      if (payment.rental_id) {
        await pool.query("UPDATE rentals SET status = 'confirmed' WHERE id = $1", [payment.rental_id]);
      }
      if (payment.order_id) {
        await pool.query("UPDATE sales_orders SET status = 'paid' WHERE id = $1", [payment.order_id]);
      }
    } else {
      await pool.query(
        'UPDATE payments SET status = $1 WHERE id = $2',
        ['failed', payment.id]
      );
    }

    res.json({ code: '0', msg: 'success' });
  } catch (err) {
    console.error('Telebirr callback error:', err);
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

// Stripe webhook (keeping existing)
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await pool.query(
        'UPDATE payments SET status = $1, metadata = $2 WHERE provider_payment_id = $3',
        ['succeeded', JSON.stringify(paymentIntent), paymentIntent.id]
      );
      
      const metadata = paymentIntent.metadata;
      if (metadata.rental_id) {
        await pool.query("UPDATE rentals SET status = 'confirmed' WHERE id = $1", [metadata.rental_id]);
      }
      if (metadata.order_id) {
        await pool.query("UPDATE sales_orders SET status = 'paid' WHERE id = $1", [metadata.order_id]);
      }
      break;

    case 'payment_intent.payment_failed':
      const failedIntent = event.data.object;
      await pool.query(
        'UPDATE payments SET status = $1 WHERE provider_payment_id = $2',
        ['failed', failedIntent.id]
      );
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;
