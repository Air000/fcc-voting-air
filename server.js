'use strict';

var express = require('express');
var routes = require("./app/routes/index.js");

var app = express();

app.use('/controllers', express.static(process.cwd() + '/app/controllers'));
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/common', express.static(process.cwd() + '/app/common'));

app.set('port', (process.env.PORT || 5000));

// app.get('/', function(request, response) {
//   //response.render('pages/index');
//   response.send("hello world!");
// });

routes(app);

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


