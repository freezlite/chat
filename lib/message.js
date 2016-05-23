"use strict";

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
                var params = [formattedText, this.filters[i][1]]               
                // params.splice(0, 1, formattedText)
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

global.Message = Message