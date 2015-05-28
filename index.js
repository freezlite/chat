var app = require('express')();
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

var announcement = '<u>Нововеденья: теперь работают ссылки. При заходе видно лог последних 15 сообщений. Вскоре чатик перенесу на домен.</u>';


var actions = {
  '\\/nickname (\\w{2,12})': function(nick, socket){
    if(!elementExists(nicknames_list, nick[1]) && nick[1] != 'system'){
      old_nickname =  nicknames[socket.id];
      nicknames[socket.id] = nick[1];
      nicknames_list.push(nick[1]);
      deleteElementIfExists(nicknames_list, old_nickname);
      io.emit('chat message', 'system: ' + old_nickname + ' change name to ' + nick[1]);
    }else{
      io.to(socket.id).emit('error', 'Such nick allready taken');
    }
  },
}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  user_count++;
  console.log('User connected, total users: ' + user_count)
  nicknames[socket.id] = 'guest' + Math.floor((Math.random() * 100) + 1);
  io.emit('chat message', nicknames[socket.id] + ' joins our chat');
  io.to(socket.id).emit('chat message', log);
  io.to(socket.id).emit('chat message', announcement);
  
  io.emit('change users count', user_count);
  socket.on('chat message', function(msg){
    if(msg){
      if(msg.length > 1000){
        io.to(socket.id).emit('error', 'Too large text');
      }else{
        var isAction = false;
        
        for (action in actions) {
            if (!actions.hasOwnProperty(action)) {
                //The current property is not a direct property of p
                continue;
            }
            
            if(match = msg.match(new RegExp(action))){
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
          formated_msg = moment().format('HH:mm:ss') + ' ' + nicknames[socket.id] +': '+ msg;
          log.push(formated_msg);
          log = log.slice(log_count*-1);
          console.log(formated_msg);
          io.emit('chat message', formated_msg);
        }
      }
    }
  });
  
  socket.on('disconnect', function(){
    user_count--;
    console.log('User disconnected, total users: ' + user_count)
    io.emit('chat message', nicknames[socket.id] + ' left chat.');
    deleteElementIfExists(nicknames_list, nicknames[socket.id]);
    delete nicknames[socket.id];
    io.emit('change users count', user_count);
  })
});


http.listen(process.env.PORT, function(){
  console.log('listening on *:' +  process.env.PORT);
});

function elementExists(arr, element){
  return  arr.indexOf(element) > -1;
}

function deleteElementIfExists(arr, element){
  index = arr.indexOf(element);
  
  if (index > -1){
    arr.splice(index, 1);
  }
}