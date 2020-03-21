const express = require('express');
const router = express.Router();
const fs = require('fs');
const expressJwt = require('express-jwt');


const RSA_PUBLIC_KEY = fs.readFileSync('./demos/jwtRS256.key.pub');



/*Authenticate if users are logged in
secret: public key to verify the signed token
getToken: ?

to indentify the userName you have to decode the Json Web Token. (not done yet)
The token is stored in the cookie with the id 'id'
cookie is logged into the console (req.cookies('id')
you can go to jwt.io to manually decode to read the header and payload so you can understand it

the payload has a variable called "sub" which is the _id in the mongodb from the userName.


 */
const checkIfAuthenticated = expressJwt({
  secret: RSA_PUBLIC_KEY,
  getToken: function fromCookie(req) {
    console.log("cookies: " + req.cookies['id']);
    if (req.cookies['id']) {
      console.log("got cookie sessionID: " + req.cookies['id']);
      return req.cookies['id'];
    }
  }
});


if (process.env.NODE_ENV === 'development') {
  const puts = (error, stdout) => {
    console.log(error);
    console.log(stdout);
  };
  console.log("redis executed");
  exec('redis/src/redis-server redis/redis.conf', puts);

}

router.get('/', checkIfAuthenticated, (req, res) => {
  res.send('api works');
});

module.exports.checkIfAuthenticated = checkIfAuthenticated;
module.exports = router;
