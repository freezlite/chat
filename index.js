"use strict";

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var moment = require('moment');
var Autolinker = require('autolinker');
var sanitizeHtml = require('sanitize-html');
var recaptcha = require('express-recaptcha');
var bodyParser = require('body-parser');
var session = require('express-session')({
  proxy: true,
  secret: 'zaeT4Oag',
  resave: true,
  saveUninitialized: true,
  secure: false
});
var sharedsession = require("express-socket.io-session");

require('./lib/chat.js')
require('./lib/message.js')
require('./lib/user.js')
 
var port = process.env.PORT || 8080
 
recaptcha.init('6Le3HCATAAAAAEXZ2UwoiOZ8_dNbssXFEP1P8ZOA', '6Le3HCATAAAAAONcgtEm9v2nPdXLJzoEIUkdO_wA');

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session)
app.use('/static', express.static('static'));
app.enable('trust proxy')

app.get('/', recaptcha.middleware.render, function(req, res){
  if (req.session.logined) {
    res.render('index');
  } else {
    res.render('login', { captcha:req.recaptcha });
  }
  req.session.save()
});

app.post('/', function(req, res){
    recaptcha.verify(req, function(error){
        if (!error) {
            req.session.logined = true
            req.session.save()
            res.redirect('/')
        }
    })
})

var announcement = 'Welcome to chat';
var chat = new Chat(io, announcement, 15);
var filters = [
    Autolinker.link,
    [
        sanitizeHtml, 
        {
            allowedTags: [ 'b', 'i', 'em', 'strong', 'a' ],
            allowedAttributes: {
              'a': [ 'href', 'target' ]
            }
        }
    ],
];

io.use(sharedsession(session));

io.on('connection', function(socket){
    var user = new User(io, socket.id);
    chat.addUser(user);
    
    socket.on('message', function(text){
        var message = new Message(user, text, filters);
        chat.sendMessage(message);
    })
    
    socket.on('disconnect', function() {
        chat.deleteUser(user);
    })
});

http.listen(port, function(){
  console.log('listening on *:' +  port);
});