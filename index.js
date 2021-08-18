'use strict';
var dateFormat = require('dateformat');
const mysql2 = require('mysql2');
const DbConnection = require('./dbConnection.js');
let v = new DbConnection();
v.setConnection();
var database = v.getConnection();
var servico,services,uInput;
var inputList=[];
var request = require('request');
var _estados = [];
var listaBotoes=require("./config.json"); 
var listaTexto=require("./configText.json");
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
            sendMenu(event.sender.id, event.postback.payload, listaBotoes);
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
  messageText=messageText.toLowerCase();
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
        if(messageText=="olá"||messageText=="ola"){
          var messageData = {
            recipient:{
              id:senderID
            },
            message: {
              text: "Olá, eu sou a Eva, a assistente pessoal da UAI."
            }
          };
          callSendAPI(messageData);           
          sendMenu(senderID, "texto_inicial", listaBotoes);
        }else if(messageText=='lista'){
          sendListOfButtons(senderID);
        }
        else{
          sendTextMessage(senderID, messageText);
        }
    }    
  }
}

function sendList(recipientID, textId, i, userInput){  
  if(i["type"]=="selecao_unidades"){
    console.log(`SELECT UNIDADE FROM servicos_disponiveis WHERE nome='${services}'`);
    database.query(`SELECT UNIDADE FROM servicos_disponiveis WHERE nome='${services}'`, (err, rows, inf)=>{       
      var cont=1;
      var lset=[];
      if(!err){
        var mySet=new Set();        
        console.log(rows);
        for(var j of rows){
          mySet.add(j.UNIDADE);             
        } 
        for(var j of mySet){            
          textId+="\n"+cont+") "+j;
          lset.push(j);
          cont++;
        }
        console.log(lset);
        writeTemporary(lset, './temporary.json');
        var messageData = {
          recipient:{
            id:recipientID
          },
          message: {
            text: textId
          }
        };          
        callSendAPI(messageData);
      }else{
          console.log('Erro ao realizar a consulta');
      }          
    });
    inputList.push(services);
    console.log(inputList);
  }else if(i["type"]=="selecao_horarios"){ 
      var unidade;      
      var cont=1;
      for(let j of readTemporary()){
        if(cont==parseInt(userInput)){
          unidade=j;
        }
        cont++;
      }
      inputList.push(unidade);
      console.log(`SELECT horario, dia FROM servicos_disponiveis WHERE unidade='${unidade}' AND nome='${services}'`);      
      database.query(`SELECT horario, dia FROM servicos_disponiveis WHERE unidade='${unidade}' AND nome='${services}'`,(err, rows, inf)=>{
        if(!err){          
          var cont=1;   
          var horarios=[]
          console.log(rows)     
          for(var j of rows){          
            console.log(j.dia);
            textId+="\n" + cont + " - " + j.horario + " " +dateFormat(j.dia, "dd/mm/yyyy");
            horarios.push([j.horario,j.dia]);
            cont++;
          }
          writeTemporary(horarios, './temporary2.json');
          var messageData = {
              recipient:{
                id:recipientID
              },
              message: {
                text: textId
              }
            };
            callSendAPI(messageData);
        }else{
            console.log('Erro ao realizar a consulta');
        }               
      });    
  }else if(i["type"]=="transicao"){
    var horario, dia;
    cont=1;
    console.log(require("./temporary2.json"));
    for(let j of require("./temporary2.json")){      
      if(cont==parseInt(userInput)){
        horario=j[0];
        dia=dateFormat(j[1],"yyyy-mm-dd");
      }
      cont++;
    }    
    database.query(`INSERT INTO agendamentos(nome, unidade, horario, dia) VALUES( '${inputList[0]}','${inputList[1]}','${horario}','${dia}')`,(err, rows, inf)=>{
      if(!err){          
        var messageData = {
          recipient:{
            id:recipientID
          },
          message: {
            text: textId
          }
        };
        callSendAPI(messageData);    
        sendMenu(recipientID, "texto_final", listaBotoes);
      }else{
        console.log('Erro ao realizar a consulta');
      }               
    });
    console.log(`DELETE FROM servicos_disponiveis WHERE nome='${inputList[0]}' AND unidade='${inputList[1]}' AND horario='${horario}' AND dia='${dia}'`);
    database.query(`DELETE FROM servicos_disponiveis WHERE nome='${inputList[0]}' AND unidade='${inputList[1]}' AND horario='${horario}' AND dia='${dia}'`,(err, rows, inf)=>{
      if(!err){                   
        
      }else{
        console.log('Erro ao realizar a consulta');
      }               
    });    
  console.log(inputList);  
  }
servico=i["send"];
}

function sendTextMessage(recipientID, userInput){
  var textId;
  uInput=userInput;
  var keepGoing=true;
  for(var i of listaTexto){
    if(userInput==i["keyword"] || servico==i["keyword"]){
      textId=i["text"];
      console.log(i["keyword"].slice(0,1));
      console.log(i["keyword"]);
      if(i["keyword"].slice(0,2)=="c_"){
        sendList(recipientID, textId, i, userInput);
        keepGoing=false;
        break;
      }
    }    
  }   
  if(keepGoing==true){  
    var messageData = {
      recipient:{
        id:recipientID
      },
      message: {
        text: textId
      }
    };
    callSendAPI(messageData);
  }
}

function sendMenu(recipientID, payloader, listId){  
  var li,textId;
  services=payloader;  
  for(var i of listId){       
    if(i[0]["id"]==payloader){
      li=i.slice(1);
      textId=i[0]["text"];
      break; 
    }
  }
  console.log(payloader.slice(0,1));
  if(payloader.slice(0,2)=="p_"){
    var messageData = {
      recipient:{
        id:recipientID
      },
      message: {
        text: textId
      }
    };
    callSendAPI(messageData); 
    sendMenu(recipientID, "texto_final", listId);
  }else if (li.length==0){
    console.log("Está indo para o texto!!!!");
    sendTextMessage(recipientID, textId);
  }else{
    var messageData = {
      recipient: {
        id: recipientID
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

function writeTemporary(x, path){
  let data = JSON.stringify(x, null, 2);
  fs.writeFile(path, data, (err) => {
      if (err) throw err;
      console.log('Data written to file');
  });
}

function readTemporary(){
  var x = require("./temporary.json")
  return x;
}

function callSendAPI(messageData){
  request({
    uri: "https://graph.facebook.com/v2.6/me/messages",
    qs:{access_token:'EAAMbtaqvnr4BALnPBrkZAM86VNDHYKWdf5bw4byQZAg9hxPVFaNKoxgBjlICeFVjnyBabTNodzm5JidEJ1RV1soNIpnpbO9l3Qap9pcEK9ZAHjbKlnPPLZA6xZCU7ePDWKZCDdVFXHDlQ9UgampTwOmIGjkUIVAUBSoIbwVZBkj93J3bN8MPCJKkz70hcsdFOYZD'},
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

