const CertificaUsuario = require("./CertificaUsuario");
const QueriesSender = require("./QueriesSender");

class MessageSender{
    constructor(stats, database){
        this._listaTexto=require("C:/Users/marce/Docs/Desenvolvimento/UaiForce/messenger-webhook/src/public/listTextOutput.json");
        this._listaBotoes=require("C:/Users/marce/Docs/Desenvolvimento/UaiForce/messenger-webhook/src/public/listButtonOutput.json");
        this._certificaUsuario = new CertificaUsuario(stats,database);
        this._queriesSender=new QueriesSender(stats,database);
        this._stats = stats;
    }
    sendSimpleMessage(sender, message){
        var messageData = {
          recipient:{
            id:sender
          },
          message: {
            text: message
          }
        };
        this.callSendAPI(messageData); 
    }

    sendTextMessage(recipientID, userInput){
        var textId;        
        var keepGoing=true;
        for(var i of this._listaTexto){
          if(userInput==i["keyword"] || this._stats.getServico()==i["keyword"]){
            textId=i["text"];      
            if(i["keyword"].slice(0,2)=="c_"){
              this._queriesSender.sendList(recipientID, textId, i, userInput);
              keepGoing=false;
              break;
            }else if(i["keyword"].slice(0,2)=="b_"){
              this._stats.setUnidade("Belo Horizonte");  
              this._queriesSender.sendList(recipientID, textId, i, userInput);
              keepGoing=false;              
              break;
            }
          }  
        }  
        if(keepGoing==true){      
          this.sendSimpleMessage(recipientID, textId);    
        }
    }

    sendMenu(recipientID, payloader){
        var li=[],textId;
        historico.push(payloader);
        console.log(payloader);
        this._stats.setServices(payloader);
        if(payloader=="cadastrado"){
          this._certificaUsuario.perguntaUsuario(recipientID, "", this._services, cpf, dNascimento);
        }
        for(var i of this._listaBotoes){       
          if(i[0]["id"]==payloader){
            li=i.slice(1);
            textId=i[0]["text"];
            break; 
          }
        }          
        if(payloader.slice(0,2)=="p_"){    
          this.sendSimpleMessage(recipientID, textId); 
          setTimeout(() => {
            this.sendMenu(recipientID, "texto_final", this._listaBotoes);
          }, 1000);    
        }else if (li.length==0){    
          this.sendTextMessage(recipientID, textId);
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
          this.callSendAPI(messageData);
        }  
    }

    callSendAPI(messageData){
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
}

module.exports = MessageSender;