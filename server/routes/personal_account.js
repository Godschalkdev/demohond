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
const dbAuth = new Database(Databases.MONGODB, DatabaseNames.AUTHDB);
const dbaccountinfo = new Database(Databases.MONGODB, DatabaseNames.ACCOUNTINFO);
const colUserAccount = 'user_account';


router.route('/getPersonalInformation').get(getPersonalInfo);

function getPersonalInfo(req, res) {

  if (req.headers.cookie) {
    if (parseCookie(req).sub) {
      var account_id = parseCookie(req).sub;
      console.log(account_id);
      var filterDataObject = {
        field_name: ['account_id'],
        operator: ['=='],
        value: [account_id],
      };
      dbaccountinfo.get(colUserAccount, filterDataObject, function (err, personalInfo) {

        if (err) {
          res.status(400);
        }
        console.log(personalInfo);
        (res.status(200).send(personalInfo));
      })
    }
  }

}


router.route('/savePersonalInformation').post(savePersonalInfo);

function savePersonalInfo(req, res) {

  if (req.headers.cookie) {
    if (parseCookie(req).sub) {

      var dataObject = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        country: req.body.country,
        company_name: req.body.company_name,
        street_address: req.body.street_address,
        street_address_optional: req.body.street_address_optional,
        state_country: req.body.state_country,
        zip_code: req.body.zip_code,
        email: req.body.email,
        phone_number: req.body.phone_number,
        gender: req.body.gender,
      };

      var account_id = parseCookie(req).sub;

      var filterDataObject = {
        field_name: ['account_id'],
        operator: ['=='],
        value: [account_id],
      };


      dbaccountinfo.update(colUserAccount, filterDataObject, dataObject, function (err, obj) {
        if (err) {
          console.log(err);
          res.status(400)
        } else {
          console.log(obj);
          res.status(202).send(obj);
        }
      });
    }
  } else {
    res.status(409).send('Login expired, pls login again');
  }
}

router.route('/createCustomer').put(createCustomer);

function createCustomer(req, res) {


  var dataObject = {
    account_id: req.body.account_id,
    gender: req.body.gender,
    country: req.body.country,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    company_name: req.body.company_name,
    dateOfBirth: req.body.dateOfBirth,
    street_address: req.body.street_address,
    street_address_optional: req.body.street_address_optional,
    state_country: req.body.state_country,
    zip_code: req.body.zip_code,
    email: req.body.email,
    phone_number: req.body.phone_number,
  };
  if (req.headers.cookie) {
    if (parseCookie(req).sub) {
      dataObject.account_id = parseCookie(req).sub;
      var filterDataObject = {
        field_name: ['account_id'],
        operator: ['=='],
        value: [dataObject.account_id],
      };
      if(req.body.account_id){
        console.log("ship different address");
        dbaccountinfo.insert(colUserAccount, dataObject, function (err, obj) {
          if (err) {
            res.status(400).send()
          } else {

            res.status(200).send(obj)
          }
        })
      } else {
        dbaccountinfo.get(colUserAccount, filterDataObject, function (err, obj) {
          if (err) {
            res.status(400).send();
          } else {
            if (obj == '') {
              console.log("no customer");
              dbaccountinfo.insert(colUserAccount, dataObject, function (err, obj) {
                if (err) {
                  res.status(400).send()
                } else {

                  res.status(200).send(obj)
                }
              })
            } else {
              console.log("already customer");
            }
          }
        });
      }
    }
  } else {
    dbaccountinfo.insert(colUserAccount, dataObject, function (err, obj) {
      if (err) {
        res.status(400).send()
      } else {
        res.status(200).send(obj)
      }
    })
  }
}


function parseCookie(req) {
  return jwt_decode(req.headers.cookie);

}

module.exports = router;
