
const request = require('request');
class MessageSender{
    constructor(stats){
        this._listaTexto = require("C:/Users/marce/Docs/Desenvolvimento/UaiForce/messenger-webhook/src/public/listTextOutput.json");
        this._listaBotoes = require("C:/Users/marce/Docs/Desenvolvimento/UaiForce/messenger-webhook/src/public/listButtonOutput.json");
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
    _voltar(recipientID, userInput){
      var stopSearch=false;
      if(userInput=="0" && this._stats.getHistorico()[this._stats.getHistorico().length-2][1]=="menu"){          
        this._stats.delHistorico();
        this.sendMenu(recipientID, this._stats.getHistorico()[this._stats.getHistorico().length-2][0][0]["id"]);
        stopSearch=true;
      }else if(userInput=="0"// && this._stats.getHistorico().length!=0 || this._stats.getHistorico().length==1 && this._stats.getHistorico()[0][0]["type"]=="selecao_horarios" && userInput=="0"
      ){      
        this._stats.delHistorico();
        var v=this._stats.getHistorico()[this._stats.getHistorico().length-1];
        this._stats.setRecipient(v[0]["keyword"]);            
        userInput=v[1];
        this._stats.delHistorico();
      }
      return stopSearch; 
    }
    sendTextMessage(recipientID, userInput){               
        console.log(this._stats.getHistorico());
        var stopSearch=this._voltar(recipientID, userInput);
        if(userInput=="unidade"){
          this._stats.setRecipient(this._stats.getTypeInput()[0]);
        }
        this._queriesSender.sendList(recipientID, userInput);
    }

    sendMenu(recipientID, payloader, tt=""){
        var li=[],textId;        
        console.log(payloader);
        this._stats.setServices(payloader);
        if(payloader=="cadastrado"){
          this._certificaUsuario.perguntaUsuario(recipientID, "");        
        }else{
          if(payloader=="texto_finalS"){
            this._queriesSender.inserir(recipientID);
            payloader=payloader.slice(0, -1);
          }
          for(var i of this._listaBotoes){          
            if(i[0]["id"]==payloader){
              this._stats.addHistorico([i, "menu"]);   
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
          }else if (textId=="unidade"){    
            this.sendTextMessage(recipientID, "unidade");           
          }else{          
            if(textId==""){
              textId=tt;
            }
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