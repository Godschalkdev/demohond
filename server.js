const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const cookieParser = require('cookie-parser');
const account = require('./server/routes/account');
const products = require('./server/routes/products');
const billing = require('./server/routes/billing');
const mollie = require('./server/payment/mollie');
const accountInfo = require('./server/routes/personal_account');
const email = require('./server/routes/email');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'dist')));
app.use(cookieParser());

app.use((req, res, next) => {

  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-type,Authorization,Origin, X-Auth-Token');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4201' );
  res.setHeader('Access-Control-Allow-Credentials', true);
  return next();
});

app.use('/account', account);
app.use('/products', products);
app.use('/billing', billing);
app.use('/payments', mollie);
app.use('/personal_account', accountInfo);
app.use('/email', email);


const port = process.env.PORT || '3001';
app.set('port', port);
app.listen(port, ()=> console.log(`Listening at localhost:${port}`));
