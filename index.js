var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var moment = require('moment');
var Autolinker = require('autolinker');
var sanitizeHtml = require('sanitize-html');

var user_count = 0;
var log_count = 15;
var nicknames = {};
var nicknames_list = [];
var log = [];

var announcement = '<u>Время теперь отображается корректно.</u>';


var actions = {
  '\\/nickname (\\w{2,12})': function(nick, socket){
    if(!elementExists(nicknames_list, nick[1]) && nick[1] != 'system'){
      var old_nickname =  nicknames[socket.id];
      nicknames[socket.id] = nick[1];
      nicknames_list.push(nick[1]);
      deleteElementIfExists(nicknames_list, old_nickname);
      io.emit('change nickname', [old_nickname, nick[1]]);
    }else{
      io.to(socket.id).emit('error', 'Such nick allready taken');
    }
  },
}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.use('/static', express.static('static'));

io.on('connection', function(socket){
  user_count++;
  console.log('User connected, total users: ' + user_count)
  nicknames[socket.id] = 'guest' + Math.floor((Math.random() * 100) + 1);
  io.emit('join', nicknames[socket.id]);
  io.to(socket.id).emit('message', log);
  io.to(socket.id).emit('announcement', announcement);
  
  io.emit('change users count', user_count);
  socket.on('message', function(msg){
    if(msg){
      if(msg.length > 1000){
        io.to(socket.id).emit('error', 'Too large text');
      }else{
        var isAction = false;
        
        for (var action in actions) {
            if (!actions.hasOwnProperty(action)) {
                //The current property is not a direct property of p
                continue;
            }
            
            var match = msg.match(new RegExp(action));
            if(match){
              isAction = true;
              actions[action](match, socket);
            }
        }
          
        if(!isAction){
          msg = Autolinker.link(msg);
          msg = sanitizeHtml(msg, {
            allowedTags: [ 'b', 'i', 'em', 'strong', 'a' ],
            allowedAttributes: {
              'a': [ 'href', 'target' ]
            }
          });
          msg = msg.replace(/(?:\r\n|\r|\n)/g, '<br />');
          var data = {
            'nickname': nicknames[socket.id],
            'msg': msg,
            'timestamp': Date.now(),
          };
          log.push(data);
          log = log.slice(log_count*-1);
          io.emit('message', data);
        }
      }
    }
  });
  
  socket.on('disconnect', function(){
    user_count--;
    console.log('User disconnected, total users: ' + user_count)
    io.emit('left', nicknames[socket.id]);
    deleteElementIfExists(nicknames_list, nicknames[socket.id]);
    delete nicknames[socket.id];
    io.emit('change users count', user_count);
  })
});


http.listen(80, function(){
  console.log('listening on *:' +  80);
});

function elementExists(arr, element){
  return  arr.indexOf(element) > -1;
}

function deleteElementIfExists(arr, element){
  var index = arr.indexOf(element);
  
  if (index > -1){
    arr.splice(index, 1);
  }
}