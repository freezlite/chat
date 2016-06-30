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
var flash = require('express-flash')
var cookieParser = require('cookie-parser')

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use('/static', express.static('static'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser('NohJ7sae'));
app.use(session)
app.use(flash());
app.enable('trust proxy')

require('./lib/chat.js')
require('./lib/message.js')
require('./lib/user.js')
 
var port = process.env.PORT || 8080
 
recaptcha.init('6Le3HCATAAAAAEXZ2UwoiOZ8_dNbssXFEP1P8ZOA', '6Le3HCATAAAAAONcgtEm9v2nPdXLJzoEIUkdO_wA');

app.get('/', recaptcha.middleware.render, function(req, res){
  if (req.session.logined) {
    res.render('index');
  } else {
    res.render('login', { captcha:req.recaptcha });
  }
  req.session.save()
});

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

app.post('/', function(req, res){
    recaptcha.verify(req, function(error){
        if (!error) {
            if (req.body.nickname) {
                if (chat.isNicknameFree(req.body.nickname)) req.session.nickname = req.body.nickname
                else {
                    req.flash('warning', 'Nickname is not avaliable')
                    res.redirect('/')
                    return
                }
            } else {
                req.flash('warning', 'Empty nickname')
                res.redirect('/')
                return
            }
            req.session.logined = true
            req.session.save()
            res.redirect('/')
        } else {
            req.flash('warning', 'Wrong captcha')
            res.redirect('/')
        }
    })
})

io.on('connection', function(socket){
    if (!socket.handshake.session.nickname || !socket.handshake.session.logined) {
        chat.sendError('You not loggined');
        socket.disconnect();
    }
    
    var user = new User(io, socket.id, socket.handshake.session.nickname);
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