const util = require('./util');

const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.get('/', async (req, res) => {
  try {
    const token = await util.token();

    res.send(token);
  } catch (err) {
    console.log(err);

    res.status(500)
       .send('Internal Server Error');
  }
})

module.exports = app;
