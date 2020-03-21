const express = require('express');
const router = express.Router();
const app = express();
const jwt = require('jsonwebtoken');
const fs = require('fs');
var ObjectId = require('mongodb').ObjectID;


const RSA_PRIVATE_KEY = fs.readFileSync('./server/JWT/jwtRS256.key');

const jwt_decode = require("jwt-decode");

const Database = require('../services/Database.js');
const {DatabaseNames} = require('../enums/database_enums');
const {Databases} = require('../enums/database_enums');
const dbProducts = new Database(Databases.MONGODB, DatabaseNames.PRODUCTS);
const colProducts= "products";


router.route('/getAllProducts').get(getAllProducts);
function getAllProducts(req, res) {

  dbProducts.getAll(colProducts, function (err, products) {
      if (products) {
        console.log("succesfully retrieved products");
        saveProductToJson(products, function(err) {
          if (err) {
            res.status(404).send('User not saved');
          }
          res.status(200).send(products);
        });
      } else {
        console.log("failed to retrieve products");
        console.log(err);
      }

    }
  )
}

function saveProductToJson(person, callback) {
  fs.writeFile('./server/localdata/products.json', JSON.stringify(person), callback);
}



router.route('/getProduct/:id').get(getProduct);
function getProduct(req, res) {

  dbProducts.getOne(colProducts,{id: req.params.id} ,function (err, products) {
      if (products) {
        console.log("succesfully retrieved products");
        res.status(200).send(products);
      } else {
        console.log("failed to retrieve products");
        console.log(err);
      }

    }
  )
}






function parseCookie(req) {
  return jwt_decode(req.headers.cookie);
}

module.exports = router;
