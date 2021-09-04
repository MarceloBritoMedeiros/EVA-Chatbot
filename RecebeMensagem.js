const CertificaUsuario = require("./CertificaUsuario");
const MessageSender = require("./MessageSender");

class RecebeMensagem{
    constructor(stats, database){
        this._stats = stats;
        this._messageSender = new MessageSender(stats, database); 
        this._certificaUsuario = new CertificaUsuario(stats, database);       
    }

    trataMensagem(event){
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
          if(messageText=="olá"||messageText=="ola" || messageText=="👍"){
            this._messageSender.sendSimpleMessage(senderID, "Olá, eu sou a Eva, a assistente pessoal da UAI."); 
            setTimeout(() => {
                this._messageSender.sendMenu(senderID, "saudacao", listaBotoes);        
            }, 1000);
          }else{
            if(this._stats.getServices=="verificação"){
              this._certificaUsuario.perguntaUsuario(senderID, messageText, this._stats);
            }
            this._messageSender.sendTextMessage(senderID, messageText);
          }       
        }
    }
}

module.exports = RecebeMensagem;