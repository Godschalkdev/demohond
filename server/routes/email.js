const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
var ObjectId = require('mongodb').ObjectID;


const RSA_PRIVATE_KEY = fs.readFileSync('./server/JWT/jwtRS256.key');

const jwt_decode = require("jwt-decode");

const Database = require('../services/Database.js');
const {DatabaseNames} = require('../enums/database_enums');
const {Databases} = require('../enums/database_enums');
const dbAuth = new Database(Databases.MONGODB, DatabaseNames.EMAIL);
const dbaccountinfo = new Database(Databases.MONGODB, DatabaseNames.EMAIL);
const colEmailSend = 'email_send';

router.route('/sendEmail').post(sendEmail);

function sendEmail(req, res) {
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


module.exports = router;
