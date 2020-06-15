'use strict';

const express = require('express');
const app = express();

require('ejs');
require('dotenv').config();

const superagent = require('superagent');

const PORT = process.env.PORT || 3001;

app.use(express.urlencoded ({ extended: true }));

app.set('view engine', 'ejs');
// app.set("views", path.results(__dirname, 'public'));

app.use(express.static('public'));
// app.use(express.static(__dirname + 'views'));

app.get('/', (req,res) =>{
  res.render('pages/index.ejs');
});

// app.get('/hello', (request,response) =>{
//   response.render('index.ejs');
// })

app.listen(PORT,() => {
  console.log(`listening on ${PORT}`);
});
