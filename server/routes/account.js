const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
var ObjectId = require('mongodb').ObjectID;
var crypto = require('crypto');
var  algorithm = 'aes-256-ctr';
var password = 'J3Mo3derH33ftC0ron4';

const RSA_PRIVATE_KEY = fs.readFileSync('./server/JWT/jwtRS256.key');

const jwt_decode = require("jwt-decode");

const Database = require('../services/Database.js');
const {DatabaseNames} = require('../enums/database_enums');
const {Databases} = require('../enums/database_enums');
const dbAuth = new Database(Databases.MONGODB, DatabaseNames.AUTHDB);
const colUserAccount = 'user_account';
const colLoggedInUser= 'logged_in';


router.post('/registreer',function (req, res, next) {
  console.log("request to register userName");
  var email;
  /*
      function is addded as paramater, this means it's an callback.
      findOne(query, callback)
      Callback means, if the query is done then do this start this function
      function(error, result(result from query here)
   */
  dbAuth.getOne(colUserAccount,{email: req.body.email}, function (err, user) {
    if (err) {
      res.status(400)
    }
    if (!user) {
      req.body.password = encrypt(req.body.password);
      dbAuth.insert(colUserAccount, {
        email: req.body.email,
        password: req.body.password,
        first_name: req.body.first_name,
        last_name: req.body.last_name
      });
      res.status(201).send("oke");
    } else {
      res.status(409).send('something went wrong')
    }
    next();
  });
});


router.route('/login').post(loginRoute);

function loginRoute(req, res) {
  const email = req.body.email,
    password =  encrypt(req.body.password);

  getUserId(email, password, function (userId) {
    console.log(userId);
    if (userId) {
        const jwtBearerToken = jwt.sign({}, RSA_PRIVATE_KEY, {
          algorithm: 'RS256',
          expiresIn: 4800,
          subject: userId
        });

        console.log(jwtBearerToken.toString());

        dbAuth.insert(colLoggedInUser, {
          _id: userId,
          token: jwtBearerToken,
        });

        res.cookie('id', jwtBearerToken, {httpOnly: false, secure: false});

        res.sendStatus(200);

    } else {
      res.sendStatus(401);
    }
  });
}

router.route('/logout').post(logoutRoute);

async function logoutRoute(req, res) {
  const token = req.cookies.id;
  console.log(token);
  try {
    //await redisClient.LPUSH('token', token);
    res.cookie('id', '', {httpOnly: false, secure: false});
    res.sendStatus(200);
  } catch (error) {
    res.status(400).json({
      'status': 500,
      'error': error.toString(),
    });
  }

}

function getUserId(email, password, callBack) {
  dbAuth.getOne('user_account', {email: email, password}, function (err, user) {
    if (user) {
      return callBack(user._id.toString());
    } else return callBack(null);
  });
}

router.route('/getUser').post(getUser);

function getUser(req, res) {
  var cookie = parseCookie(req);
  var userId = cookie.sub;
  var myquery = {
    _id: ObjectId(userId)
  };
  console.log(ObjectId(userId));

  dbAuth.getOne(colUserAccount, myquery, function (err, user) {
      if (user) {
        console.log("succesfully retrieved userData");
        res.status(200).send(user);
      } else {
        console.log("failed to retrieve userData");
        console.log(err);
      }

    }
  )

}

function encrypt(buffer){
  var cipher = crypto.createCipher(algorithm, password);
  var crypted = Buffer.concat([cipher.update(buffer),cipher.final()]);
  return crypted;
}

function decrypt(buffer){
  var decipher = crypto.createDecipher(algorithm, password);
  var dec = Buffer.concat([decipher.update(buffer) , decipher.final()]);
  return dec;
}


router.route('/changePassword').post(changePassword);
function changePassword(req, res) {
  if (req.headers.cookie) {
    if (parseCookie(req).sub) {

      var dataObject = {
        password: encrypt(req.body.newPassword),
      };

      var filterDataObject = {
        field_name: ['email'],
        operator: ['==',],
        value: [req.body.email],
      };


      dbAuth.update(colUserAccount, filterDataObject, dataObject, function (err, obj) {
        if (err) {
          console.log(err);
          res.status(400)
        } else {
          console.log('password changed');
          res.status(200).send(obj);
        }
      });
    }
  }else {
    res.status(409).send('Login expired, pls login again');
  }
}

function parseCookie(req) {
  return jwt_decode(req.headers.cookie);

}
module.exports = router;
