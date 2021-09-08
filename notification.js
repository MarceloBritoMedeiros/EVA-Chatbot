const DbConnection = require('./dbConnection');
const MessageSender = require('./MessageSender');
const Stats = require('./Stats');
const FileOperations = require('./FileOperations');
var request = require('request');
let connection = new DbConnection();
connection.setConnection();
let database = connection.getConnection();
stats=new Stats();
messageSender=new MessageSender(stats);
dateFormat = require('dateformat');
// Imports dependencies and set up http server
const
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 5000, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook 


// Checks this is an event from a page subscription
var schedule = require('node-schedule');

var date = new Date(2021, 8, 07, 17, 01, 0);
console.log(date);
//var j = schedule.scheduleJob(date, function(){
database.query("SELECT * FROM agendamentos",(err, rows, inf)=>{
    if(!err){
        for(i of rows){            
            enviarNotificacao(rows[0]);
        }
    }else{
        console.log('Erro ao realizar a consulta');
    } 
})
function enviarNotificacao(consulta){
    var string=`Olá, aqui é a Eva. Estou passando para confirmar o seu agendamento de ${consulta.nome.toUpperCase()} amanhã às ${consulta.horario.slice(0, -2)} na Uai ${consulta.unidade}. Você poderá comparecer?`    
    FileOperations.writeTemporary(consulta, "./src/public/temporaryNotification.json");
    messageSender.sendMenu(consulta.senderToken,"notificacao", string);
}
    
//});

app.post('/webhook', (req, res) => {
 
let body = req.body;
  if (body&&body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but 
      // will only ever contain one message, so we get index 0
      entry.messaging.forEach(function(event){
        console.log("DDDDDD"+event)
        if(event.postback && event.postback.payload){
        if(event.postback.payload=="confirma_presenca"){
            messageSender.sendSimpleMessage(event.sender, "Agendamento Confirmado!");
        }else{
            var info=FileOperations.readTemporary("./src/public/temporaryNotification.json");
            console.log(`SELECT * FROM agendamentos WHERE senderToken='${info["senderToken"]}'`)
            database.query(`SELECT * FROM agendamentos WHERE senderToken='${info["senderToken"]}'`,(err, rows, inf)=>{
                if(!err){    
                    console.log(`INSERT INTO agendamentos(nome, unidade, horario, dia) VALUES('${rows.nome}', '${rows.unidade}', '${rows.horario}', '${rows.dia}')`)
                    database.query(`INSERT INTO agendamentos(nome, unidade, horario, dia) VALUES('${rows.nome}', '${rows.unidade}', '${rows.horario}', '${rows.dia}')`, (err, rows, inf)=>{
                        if(err){                  
                          console.log('Erro ao realizar a consulta');
                        }});
                }else{              
                  console.log('Erro ao realizar a consulta');
                }               
              });
              console.log(`DELETE FROM agendamentos WHERE senderToken='${info["senderToken"]}'`)
            database.query(`DELETE FROM agendamentos WHERE senderToken='${info["senderToken"]}'`,(err, rows, inf)=>{
                if(err){                  
                  console.log('Erro ao realizar a consulta');
                }               
              });
            messageSender.sendSimpleMessage(info["senderToken"], "Agendamento Cancelado!");
        }}
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
