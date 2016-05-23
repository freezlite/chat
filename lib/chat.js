"use strict";

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
        this.io.emit('join', user.nickname);
        this.io.emit('change users count', this.users.length);
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

global.Chat = Chat