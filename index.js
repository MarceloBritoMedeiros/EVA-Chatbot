'use strict';
var dateFormat = require('dateformat');
const mysql2 = require('mysql2');
const DbConnection = require('./dbConnection.js');
let v = new DbConnection();
v.setConnection();
var database = v.getConnection();
var servico,services="",unidade, cpf="",dNascimento, uInput;
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
    if(messageText=="olá"||messageText=="ola"){    
      sendSimpleMessage(senderID, "Olá, eu sou a Eva, a assistente pessoal da UAI."); 
      setTimeout(() => {
        sendMenu(senderID, "saudacao", listaBotoes);        
      }, 1000);                
    }else{
      if(services=="verificação"){
        perguntaUsuario(senderID, messageText);
      }
      sendTextMessage(senderID, messageText);
    }       
  }
}
function perguntaUsuario(sender, messageText){
  if(services=="cadastrado"){
    services="verificação";
    sendSimpleMessage(sender,"Para começarmos o atendimento, digite o seu CPF.");       
  }else if(cpf==""){
    cpf=messageText;
    sendSimpleMessage(sender,"Agora, digite a sua data de nascimento.(DD-MM-AAAA)");    
  }else if(dNascimento==null){
    var tt=messageText.split('-');
    var s="";
    var uData;
    for(var i=tt.length-1;i>=0;i--){
      s+=tt[i]+"-"
    }  
    s=s.slice(0,-1);
    console.log(s);             
    var dd=new Date(s+'T10:20:30Z')
    dNascimento=dateFormat(Date.parse(dd),"yyyy-mm-dd");
    console.log(dNascimento);
    verificaUsuario();
    uData=readTemporary("./temporaryUser.json");    
    console.log(uData.length);
    if(uData.length!=0){
      sendSimpleMessage(sender, `Seja bem vindo, ${uData[0]["nome"]}!`)
      setTimeout(() => {
        sendMenu(sender, "texto_inicial", listaBotoes);
      }, 1000);      
    }else{
      sendSimpleMessage(sender, "CPF ou data de nascimento incorretos");
      services="";
      cpf="";
      dNascimento=null;
      setTimeout(() => {
        perguntaUsuario(sender);
      }, 1000);      
    }            
  }
}
function verificaUsuario(){
  console.log(`SELECT id_usuario, nome FROM usuario WHERE cpf='${cpf}' AND data_nascimento='${dNascimento}'`);
  database.query(`SELECT id_usuario, nome FROM usuario WHERE cpf='${cpf}' AND data_nascimento='${dNascimento}'`, (err, rows, inf)=>{
    if(!err){
      writeTemporary(rows, "./temporaryUser.json");       
    }else{
      console.log("Não foi possível fazer a consulta de usuário");
    }
  })
}

function sendSimpleMessage(sender, message){
  var messageData = {
    recipient:{
      id:sender
    },
    message: {
      text: message
    }
  };
  callSendAPI(messageData); 
}
function sendList(recipientID, textId, i, userInput){  
  if(i["type"]=="selecao_unidades"){
    console.log(`SELECT UNIDADE FROM servicos_disponiveis WHERE nome='${services}'`);
    database.query(`SELECT UNIDADE FROM servicos_disponiveis WHERE nome='${services}'`, (err, rows, inf)=>{       
      var cont=1;
      var lset=[];
      if(!err){
        var mySet=new Set();   
        for(var j of rows){
          mySet.add(j.UNIDADE);             
        } 
        for(var j of mySet){            
          textId+="\n"+cont+" - "+j;
          lset.push(j);
          cont++;
        }        
        writeTemporary(lset, './temporary.json');                
        sendSimpleMessage(recipientID, textId);        
      }else{
          console.log('Erro ao realizar a consulta');
      }          
    });  
  }else if(i["type"]=="selecao_horarios"){            
      var cont=1;
      if(unidade!="Belo Horizonte"){
        for(let j of readTemporary('./temporary.json')){
          if(cont==parseInt(userInput)){
            unidade=j;
          }
          cont++;
        }
      }      
      console.log(`SELECT horario, dia FROM servicos_disponiveis WHERE unidade='${unidade}' AND nome='${services}'`);      
      database.query(`SELECT horario, dia FROM servicos_disponiveis WHERE unidade='${unidade}' AND nome='${services}'`,(err, rows, inf)=>{
        if(!err){          
          var cont=1;   
          var horarios=[]              
          for(var j of rows){                
            textId+="\n" + cont + " - " + j.horario + " " +dateFormat(j.dia, "dd/mm/yyyy");
            horarios.push([j.horario,j.dia]);
            cont++;
          }
          writeTemporary(horarios, './temporary2.json');          
          sendSimpleMessage(recipientID, textId);
            
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
    var idUser=readTemporary('./temporaryUser.json');
    console.log(`INSERT INTO agendamentos(nome, unidade, horario, dia, id_usuario) VALUES( '${services}','${unidade}','${horario}','${dia}','${idUser[0]["id_usuario"]}')`)
    database.query(`INSERT INTO agendamentos(nome, unidade, horario, dia, id_usuario) VALUES( '${services}','${unidade}','${horario}','${dia}','${idUser[0]["id_usuario"]}')`,(err, rows, inf)=>{
      if(!err){         
        sendSimpleMessage(recipientID, textId);
         setTimeout(() => {
          sendMenu(recipientID, "texto_final", listaBotoes);
         }, 1000);
        
      }else{
        console.log('Erro ao realizar a consulta');
      }               
    });
    console.log(`DELETE FROM servicos_disponiveis WHERE nome='${services}' AND unidade='${unidade}' AND horario='${horario}' AND dia='${dia}'`);
    database.query(`DELETE FROM servicos_disponiveis WHERE nome='${services}' AND unidade='${unidade}' AND horario='${horario}' AND dia='${dia}'`,(err, rows, inf)=>{
      if(!err){                   
        
      }else{
        console.log('Erro ao realizar a consulta');
      }               
    });    
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
      if(i["keyword"].slice(0,2)=="c_"){
        sendList(recipientID, textId, i, userInput);
        keepGoing=false;
        break;
      }else if(i["keyword"].slice(0,2)=="b_"){
        unidade="Belo Horizonte";        
        sendList(recipientID, textId, i, userInput);
        keepGoing=false;                
        break;
      }
    }  
  }  
  if(keepGoing==true){      
    sendSimpleMessage(recipientID, textId);    
  }
}

function sendMenu(recipientID, payloader, listId){  
  var li=[],textId;
  services=payloader; 
  if(payloader=="cadastrado"){
    perguntaUsuario(recipientID, "");
  } 
  for(var i of listId){       
    if(i[0]["id"]==payloader){
      li=i.slice(1);
      textId=i[0]["text"];
      break; 
    }
  }  
  if(payloader.slice(0,2)=="p_"){    
    sendSimpleMessage(recipientID, textId); 
    setTimeout(() => {
      sendMenu(recipientID, "texto_final", listId);
    }, 1000);    
  }else if (li.length==0){    
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

function readTemporary(path){
  var x = require(path)
  return x;
}

function callSendAPI(messageData){
  request({
    uri: "https://graph.facebook.com/v2.6/me/messages",
    qs:{access_token:'EAALOOKHQWHoBAIlYpHQLXZBVjZBpBf2ka5dqpMlTcpc7VYuLf8VB5EgEWvNdiOOmcGYo3f254oDQ974k1biJQrSFJKNs8x232WIwBk2IuQdRmek4yPinDGUKUrZBEZBEmQwKQSbjsbHze5NuoJv8mZBCr2LpgZCM49J7JUUHdIIhr6qAQQXwnd05q85DeC7RQZD'},
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

