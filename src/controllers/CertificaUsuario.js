const dateFormat = require('dateformat');
const FileOperations = require("C:/Users/marce/Docs/Desenvolvimento/UaiForce/messenger-webhook/src/helpers/FileOperations.js");

class CertificaUsuario{
    constructor(stats,database, messageSender){
      this._database = database;      
      this._messageSender = messageSender;  
      this._stats = stats;  
      this._recusado = false;
    }
    
    perguntaUsuario(sender, messageText, services=""){
      if(this._recusado==true){   
        this._recusado=false;         
        this._stats.setCpf("");
        this._stats.setDNascimento(null);                  
      } 
      console.log(this._stats.getCpf());
      if(this._stats.getServices()=="cadastrado"||services=="cadastrado"){
        if(services=="cadastrado"){
          this._messageSender.sendSimpleMessage(sender, "CPF ou data de nascimento incorretos");
        }
        this._stats.setServices("verificação");
        setTimeout(() => {
          this._messageSender.sendSimpleMessage(sender,"Para começarmos o atendimento, digite o seu CPF.");
        }, 1000);               
      }else if(this._stats.getCpf()==""){
        this._stats.setCpf(messageText);
        this._messageSender.sendSimpleMessage(sender,"Agora, digite a sua data de nascimento.(DD-MM-AAAA)");           
      }else if(this._stats.getDNascimento()==null){
        var tt=messageText.split('-');
        var s="";          
        for(var i=tt.length-1;i>=0;i--){
          s+=tt[i]+"-"
        }  
        s=s.slice(0,-1);
        console.log(s);
        var dd=new Date(s+'T10:20:30Z');
        this._stats.setDNascimento(dateFormat(Date.parse(dd),"yyyy-mm-dd"));
        this.verificaUsuario(sender);
        //uData=FileOperations.readTemporary("./src/public/temporaryUser.json");                 
      }
      }
      verificaUsuario(sender){
        console.log(`SELECT id_usuario, nome FROM usuario WHERE cpf='${this._stats.getCpf()}' AND data_nascimento='${this._stats.getDNascimento()}'`);
        this._database.query(`SELECT id_usuario, nome FROM usuario WHERE cpf='${this._stats.getCpf()}' AND data_nascimento='${this._stats.getDNascimento()}'`, (err, rows, inf)=>{
          if(!err){
            console.log(rows.length);
            if(rows.length>0){
              console.log("FOOOOOOi");
              this._messageSender.sendSimpleMessage(sender, `Seja bem vindo, ${rows[0]["nome"]}!`);
              setTimeout(() => {
                this._messageSender.sendMenu(sender, "texto_inicial");
              }, 1000);      
              FileOperations.writeTemporary(rows, "C:/Users/marce/Docs/Desenvolvimento/UaiForce/messenger-webhook/src/public/temporaryUser.json");  
            }else{
              this.perguntaUsuario(sender,"", "cadastrado")
            }                 
          }else{
            console.log("Não foi possível fazer a consulta de usuário")
          }
        })
        this._recusado=true;
      }
}

module.exports = CertificaUsuario;