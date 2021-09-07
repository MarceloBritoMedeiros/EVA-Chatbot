
var request = require('request');
class MessageSender{
    constructor(stats){
        this._listaTexto=require("C:/Users/marce/Docs/Desenvolvimento/UaiForce/messenger-webhook/src/public/listTextOutput.json");
        this._listaBotoes=require("C:/Users/marce/Docs/Desenvolvimento/UaiForce/messenger-webhook/src/public/listButtonOutput.json");
        this._certificaUsuario;
        this._queriesSender;
        this._stats = stats;
    }

    setCertificaUsuario(certificaUsuario){
      this._certificaUsuario=certificaUsuario;
    }

    setQueriesSender(queriesSender){
      this._queriesSender=queriesSender;
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
          if(userInput=="0"){            
            this._stats.setRecipient(this._stats.getListaUnidades());
          }
          if(userInput==i["keyword"] || this._stats.getRecipient()==i["keyword"]){
            if(i["type"]=="selecao_unidades"){
              this._stats.setListaUnidades(i["keyword"]);
            }
            textId=i["text"];
            if(i["keyword"].slice(0,2)=="c_"){
              this._stats.addHistorico([i, userInput]);
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
        //historico.push(payloader);
        console.log(payloader);
        this._stats.setServices(payloader);
        if(payloader=="cadastrado"){
          this._certificaUsuario.perguntaUsuario(recipientID, "");
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
            this.sendMenu(recipientID, "texto_final");
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
}

module.exports = MessageSender;