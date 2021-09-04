const MessageSender=require("./MessageSender.js")
const dateFormat = require('dateformat');
const FileOperations = require("./FileOperations.js");

class CertificaUsuario{      
    constructor(stats,database){
      this._database=database;      
      this._messageSender=new MessageSender(stats, database);          
    }
    
    perguntaUsuario(sender, messageText, stats){
        if(stats.getServices()=="cadastrado"){
          stats.setServices("verificação");
          this._messageSender.sendSimpleMessage(sender,"Para começarmos o atendimento, digite o seu CPF.");       
        }else if(stats.getCpf()==""){
          stats.setCpf(messageText);
          this._messageSender.sendSimpleMessage(sender,"Agora, digite a sua data de nascimento.(DD-MM-AAAA)");           
        }else if(stats.getDNascimento()==null){
          var tt=messageText.split('-');
          var s="";
          var uData;
          for(var i=tt.length-1;i>=0;i--){
            s+=tt[i]+"-"
          }  
          s=s.slice(0,-1);
          console.log(s);
          var dd=new Date(s+'T10:20:30Z');
          stats.setDNascimento(dateFormat(Date.parse(dd),"yyyy-mm-dd"));
          this.verificaUsuario();
          uData=FileOperations.readTemporary("./src/public/temporaryUser.json");
          console.log(uData.length);
          if(uData.length!=0){
            this._messageSender.sendSimpleMessage(sender, `Seja bem vindo, ${uData[0]["nome"]}!`);
            setTimeout(() => {
              this._messageSender.sendMenu(sender, "texto_inicial", listaBotoes);
            }, 1000);      
          }else{
            this._messageSender.sendSimpleMessage(sender, "CPF ou data de nascimento incorretos");
            stats.setServices("");
            stats.setCpf("");
            stats.setDNascimento(null);
            setTimeout(() => {
              this._messageSender.perguntaUsuario(sender);
            }, 1000);      
          }            
        }
      }
      verificaUsuario(){
        console.log(`SELECT id_usuario, nome FROM usuario WHERE cpf='${cpf}' AND data_nascimento='${dNascimento}'`);
        this._database.query(`SELECT id_usuario, nome FROM usuario WHERE cpf='${cpf}' AND data_nascimento='${dNascimento}'`, (err, rows, inf)=>{
          if(!err){
            FileOperations.writeTemporary(rows, './src/public/temporaryUser.json');       
          }else{
            console.log("Não foi possível fazer a consulta de usuário")
          }
        })
      }
}

module.exports = CertificaUsuario;