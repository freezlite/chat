"use strict";

class User{
    constructor(io, socket_id){
        this.io = io;
        this.nickname = User.generateNickName();
        this.socket_id = socket_id;
    }
    
    emit(event, message){
        this.io.to(this.socket_id).emit(event, message);
    }
    
    sendMessage(message){
        this.emit('message', message);
    }
    
    sendError(text){
        this.emit('error', text);
    }
    
    sendAnnouncment(text){
        this.emit('announcement', text);
    }
    
    sendUserList(nicknames){
        this.emit('users', nicknames);
    }
    
    static generateNickName(){
        return 'guest' + Math.floor((Math.random() * 100) + 1)
    }
}

class Chat{
    constructor(io, announcement, history_limit){
        this.io = io;
        this.users = [];
        this.announcement = announcement;
        this.history = [];
        this.history_limit=history_limit;
    }
    
    addUser(user){
        this.users.push(user);
        io.emit('join', user.nickname);
        io.emit('change users count', this.users.length);
        user.sendMessage(this.history);
        user.sendUserList(this.getNicknamesListFromUsers());
        user.sendAnnouncment(this.announcement);
    }
    
    deleteUser(user){
        var index = this.users.indexOf(user);
  
        if (index > -1){
            this.users.splice(index, 1);
        }
        
        this.io.emit('change users count', this.users.length);
        this.io.emit('left', user.nickname);
    }
    
    sendMessage(message){
        this.io.emit('message', message.toArray());
        this.addMessageToHistory(message);
    }
    
    addMessageToHistory(message){
        this.history.push(message);
        this.history = this.history.slice(this.history_limit*-1);
    }
    
    getNicknamesListFromUsers(){
        var nicknames = [];
        
        for(var i=0; i<this.users.length;i++){
            nicknames.push(this.users[i].nickname)
        }
        
        return nicknames;
    }
}

class Message{
    constructor(user, text, filters){
        this.user = user;
        this.text = text;
        this.timestamp = Date.now();
        this.filters = filters;
    }
    
    formatText(){
        var formattedText = this.text;
        for(var i=0; i < this.filters.length; i++){
            // If arguments needed
            if (this.filters[i] instanceof Array){
                var func = this.filters[i][0]
                var params = this.filters[i]
                params.splice(0, 1, formattedText)
            } else {
                var func = this.filters[i]
                var params = [formattedText]
            }
            
            formattedText = func.apply(this, params)
        }
        
        return formattedText;
    }
    
    toArray(){
        return {
            'nickname': this.user.nickname,
            'msg': this.formatText(),
            'timestamp': this.timestamp,
        }
    }
}

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var moment = require('moment');
var Autolinker = require('autolinker');
var sanitizeHtml = require('sanitize-html');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use('/static', express.static('static'));

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

http.listen(process.env.PORT, function(){
  console.log('listening on *:' +  process.env.PORT);
});