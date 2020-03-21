const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
var ObjectId = require('mongodb').ObjectID;
const {createMollieClient} = require('@mollie/api-client');
const mollieClient = createMollieClient({apiKey: 'test_QnJCbR8GwcBmuNMdj5GtBmHnbPevhB'});


const RSA_PRIVATE_KEY = fs.readFileSync('./server/JWT/jwtRS256.key');

const jwt_decode = require("jwt-decode");

const Database = require('../services/Database.js');
const {DatabaseNames} = require('../enums/database_enums');
const {Databases} = require('../enums/database_enums');
const dbBilling = new Database(Databases.MONGODB, DatabaseNames.BILLING);

const colBilling = "billing";
const colOrder = 'order';
const mollie = require('../payment/mollie');

const nodemailer = require("nodemailer");

router.route('/insertBilling').put(insertBilling);

function insertBilling(req, res) {

  var dataObject = {
    country: req.body.country,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    company_name: req.body.company_name,
    street_address: req.body.street_address,
    street_address_optional: req.body.street_address_optinal,
    state_country: req.body.state_country,
    zip_code: req.body.zip_code,
    email: req.body.email,
    phone_number: req.body.phone_number,
    extra_note: req.body.extra_note,
  };

  dbBilling.insert(colBilling, dataObject, function (err, obj) {
    if (err) {
      res.status(400).send()
    } else {
      res.status(201).send(obj)
    }
  });


}

router.route('/getMyOrders').get(getMyOrders);

function getMyOrders(req, res) {
  if (parseCookie(req).sub) {
    const account_id = parseCookie(req).sub;
    var filterDataObject = {
      field_name: ['customer_id'],
      operator: ['=='],
      value: [account_id],
    };
    dbBilling.get(colOrder, filterDataObject, function (err, myOrders) {
      if (err) {
        console.log(err);
        res.status(400);
      }
      console.log(myOrders);
      res.status(200).send(myOrders);

    })
  }
}
router.route('/getMyOrder/:id').get(getMyOrder);
function getMyOrder(req, res) {
  if (parseCookie(req).sub) {
    const account_id = parseCookie(req).sub;
      console.log(account_id);
     const order_number = parseInt(req.params.id);
    dbBilling.getOne(colOrder, {order_number: order_number, customer_id: account_id}, function (err, order) {
        if (order) {
          console.log("succesfully retrieved order");
          console.log(order);
          res.status(200).send(order);
        } else {
          console.log("failed to retrieve order");
          console.log(err);
        }

      }
    )
  }
}



router.route('/createOrder').put(createOrder);

function createOrder(req, res) {
  var subtotal = calculateSubTotal(req.body.products);
  console.log("subtotal: " + subtotal);
  var dataObject = {
    order_number: req.body.order_number,
    payment_method: req.body.payment_method,
    payment_status: req.body.payment_status,
    customer_id: req.body.customer_id,
    products: req.body.products,
    country: req.body.country,
    gender: req.body.gender,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    street_address: req.body.street_address,
    street_address_optional: req.body.street_address_optinal,
    state_country: req.body.state_country,
    zip_code: req.body.zip_code,
    email: req.body.email,
    phone_number: req.body.phone_number,
    extra_note: req.body.extra_note,
    order_date: Date.now(),
    subtotal: subtotal,
  };

  if (req.headers.cookie) {
    if (parseCookie(req).sub) {
      dataObject.customer_id = parseCookie(req).sub;
      console.log('customer_id = ' + parseCookie(req).sub);
    }
  }

  dbBilling.insert(colOrder, dataObject, function (err, obj) {
    if (err) {
      res.status(400).send()
    } else {
      createPayment(dataObject, res);
    }
  });


}


function calculateSubTotal(productId) {
  var subtotal = 0;
  var products = JSON.parse(fs.readFileSync('./server/localdata/products.json', 'utf-8'));
  console.log(products);
  productId.forEach(id => {
    products.forEach(product => {

      if (id === product.id) {

        subtotal += product.price;
      }
    })
  });

  return "" + subtotal + ".00";
}


function createPayment(req, res) {
  (async () => {
    await mollieClient.payments.create({
      amount: {
        currency: 'EUR',
        value: req.subtotal, // We enforce the correct number of decimals through strings
      },
      description: 'new order with id: ' + req.order_number,
      redirectUrl: 'http://localhost:4201/cart/checkout/order-completed',
      metadata: {
        order_id: '#' + req.order_number,
      },
    }).then(payment => {

      console.log(payment);
      console.log(payment.getPaymentUrl());
      res.status(200).send(payment.getPaymentUrl());
    });
  })();
}

function p(){
  async function main() {

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "smtp.live.com",
      port: 25,
      secure: false, // true for 465, false for other ports
      auth: {
        user: '', // generated ethereal user
        pass: '' // generated ethereal password
      }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"Fred Foo 👻" <giftmyfriend@hotmail.com>', // sender address
      to: "", // list of receivers
      subject: "Hello ✔", // Subject line
      text: "Hello world?", // plain text body
      html: "<b>Hello world?</b>" // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  }

  main().catch(console.error);

}

function parseCookie(req) {
  return jwt_decode(req.headers.cookie);

}

module.exports = router;
