'use strict';

var request = require('request');
var _estados = [];
var lista=require("./config.json"); 
const fs = require('fs');
// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 5000, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {
 
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body&&body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      entry.messaging.forEach(function(event){
        if(event.message){
          trataMensagem(event);
        }else{
          if(event.postback && event.postback.payload){                
            sendMenu(event.sender.id, event.postback.payload, lista);
          }
        }
      });
      //console.log(webhook_event);
    });
    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "687697657567dxfsx";
    
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

function trataMensagem(event){
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOffMessage = event.timestamp;
  var message = event.message;
  console.log("Mensagem recebida pelo usuário %d pela página %d", senderID, recipientID);

  var messageID = message.mid;
  var messageText = message.text;
  var attachments = message.attachments;

  if(messageText){
    if(_estados[senderID]){
      switch(_estados[senderID]){
        case "sim":
          console.log("Tenho que enviar o menos para essa pessoa")
          break;
        case "não":
          console.log("sss");
      }
    }else{
      switch(messageText){
        case 'start':                
          sendMenu(senderID, "0", lista);
          break;
        case 'oi':
          sendTextMessage(senderID, 'Oi, tudo bem com você?')
          break;
        case 'tchau':
          sendTextMessage(senderID, 'Tchau, até a próxima!');
          break;
        default:
          sendTextMessage(senderID, 'Eu não entendi a sua pergunta.');
      }
    }    
  }
}


function sendTextMessage(recipientID, messageText){
  var messageData = {
    recipient:{
      id:recipientID
    },
    message: {
      text: messageText
    }
  };
  callSendAPI(messageData);
}

function sendMenu(recipientId, payloader, listId){
  var li,textId;
  if(payloader=="0"){
    li=listId[0].slice(1);
    textId=listId[0][0]["text"];
  }else{
    for(var i of listId.slice(1)){       
      if(i[0]["id"]==payloader){
        li=i.slice(1);
        textId=i[0]["text"];   
        break; 
      }
    }
  }
  if (li.length==0){
    console.log("Está indo para o texto!!!!");
    sendTextMessage(recipientId, textId);
  }else{
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: textId,
            buttons: li
          }
        }
      }
    }
    callSendAPI(messageData);
  }
  
}


function callSendAPI(messageData){
  request({
    uri: "https://graph.facebook.com/v2.6/me/messages",
    qs:{access_token:'EAALOOKHQWHoBAEsLaDejLas5aR4romuTJTvqjUHkITUDULs9RV4FpQdHLKK9O26JaV3x9JRd89w5NUHyXzVVeeQ6H82aloOIHEtILTnu6xcoZCTqe2u9REGX5RZCJBdkoLwX0HhWuJHjSDMX6L92IccO8r7Twz48mtvRt33QP9hcjWR0P1GghSWtwjOAIZD'},
    method: 'POST',
    json: messageData
  }, function(error, response, body){

    if(!error && response.statusCode == 200){
      console.log("Mensagem enviada com sucesso");
    }else{
      console.log('Não foi possível enviar a mensagem');
      console.log(body);
    }
  })
}