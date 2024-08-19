const util = require('./util');

const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.set('view engine', 'pug');

app.use('/bootstrap', express.static(__dirname + '/../node_modules/bootstrap/dist'));

app.get('/', async (req, res) => {
  let token;

  try {
    token = await util.token();
  } catch (err) {
    console.log('Error getting access token', err);

    res.status(500)
       .end('Internal Server Error');

    return;
  }

  res.render('index');
})

module.exports = app;
