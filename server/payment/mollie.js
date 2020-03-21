const { createMollieClient } = require('@mollie/api-client');
const mollieClient = createMollieClient({ apiKey: 'test_QnJCbR8GwcBmuNMdj5GtBmHnbPevhB' });


const express = require('express');
const router = express.Router();



  function createPayment(req, res)
{
  (async () => {
    await mollieClient.payments.create({
      amount: {
        currency: 'EUR',
        value: req.body.subtotal, // We enforce the correct number of decimals through strings
      },
      description: 'Order #12345',
      redirectUrl: 'http://localhost:4201/cart/checkout/order-completed',
      metadata: {
        order_id: '12345',
      },
    }).then(payment => {

      console.log(payment);

    });
  })();
}

module.exports = router;



