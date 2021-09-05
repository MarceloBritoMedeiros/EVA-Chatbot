const MessageSender=require("./MessageSender.js")
const dateFormat = require('dateformat');
const FileOperations = require("./FileOperations.js");

class CertificaUsuario{      
    constructor(stats,database, messageSender){
      this._database = database;      
      this._messageSender = messageSender;  
      this._stats = stats;        
    }
    
    perguntaUsuario(sender, messageText){
        console.log(this._stats.getCpf());
        if(this._stats.getServices()=="cadastrado"){
          this._stats.setServices("verificação");
          this._messageSender.sendSimpleMessage(sender,"Para começarmos o atendimento, digite o seu CPF.");       
        }else if(this._stats.getCpf()==""){
          this._stats.setCpf(messageText);
          this._messageSender.sendSimpleMessage(sender,"Agora, digite a sua data de nascimento.(DD-MM-AAAA)");           
        }else if(this._stats.getDNascimento()==null){
          var tt=messageText.split('-');
          var s="";
          var uData;
          for(var i=tt.length-1;i>=0;i--){
            s+=tt[i]+"-"
          }  
          s=s.slice(0,-1);
          console.log(s);
          var dd=new Date(s+'T10:20:30Z');
          this._stats.setDNascimento(dateFormat(Date.parse(dd),"yyyy-mm-dd"));
          this.verificaUsuario();
          uData=FileOperations.readTemporary("./src/public/temporaryUser.json");
          console.log(uData.length);
          if(uData.length!=0){
            this._messageSender.sendSimpleMessage(sender, `Seja bem vindo, ${uData[0]["nome"]}!`);
            setTimeout(() => {
              this._messageSender.sendMenu(sender, "texto_inicial");
            }, 1000);      
          }else{
            this._messageSender.sendSimpleMessage(sender, "CPF ou data de nascimento incorretos");
            this._stats.setServices("");
            this._stats.setCpf("");
            this._stats.setDNascimento(null);
            setTimeout(() => {
              this._messageSender.perguntaUsuario(sender, "");
            }, 1000);      
          }            
        }
      }
      verificaUsuario(){
        console.log(`SELECT id_usuario, nome FROM usuario WHERE cpf='${this._stats.getCpf()}' AND data_nascimento='${this._stats.getDNascimento()}'`);
        this._database.query(`SELECT id_usuario, nome FROM usuario WHERE cpf='${this._stats.getCpf()}' AND data_nascimento='${this._stats.getDNascimento()}'`, (err, rows, inf)=>{
          if(!err){
            FileOperations.writeTemporary(rows, './src/public/temporaryUser.json');       
          }else{
            console.log("Não foi possível fazer a consulta de usuário")
          }
        })
      }
}

module.exports = CertificaUsuario;