const FileOperations = require('./FileOperations');
dateFormat = require('dateformat');

class QueriesSender{
  constructor(stats,database, messageSender){
      this._recipientID;
      this._textID;      
      this._stats = stats;
      this._database=database;
      this._messageSender = messageSender;    
      //this._notificationSender = new NotificationSender();      
  }

  _selecaoUnidades(recipientID, textId, i){
    console.log(`SELECT UNIDADE FROM servicos_disponiveis WHERE nome='${this._stats.getServices()}' ORDER BY nome`);
    this._database.query(`SELECT UNIDADE FROM servicos_disponiveis WHERE nome='${this._stats.getServices()}' ORDER BY nome`, (err, rows, inf)=>{       
      var cont=1;          
      if(!err){
        var mySet=new Set();   
        for(var j of rows){
          mySet.add(j.UNIDADE);
        }
        for(var j of mySet){            
          textId+="\n*"+cont+"* - "+j;              
          cont++;
        }
        textId+="\n*0* - Voltar";  
        FileOperations.writeTemporary(Array.from(mySet), './src/public/temporary.json');                
        this._messageSender.sendSimpleMessage(recipientID, textId);        
      }else{
          console.log('Erro ao realizar a consulta');
      }          
    }); 
    this._stats.setRecipient(i["send"]);       
  }

  _selecaoDias(recipientID, textId, userInput, i){
    var cont=1;
    var keepGoing = false;
    if(this._stats.getUnidade()!="Belo Horizonte"){
      for(let j of FileOperations.readTemporary('./src/public/temporary.json')){
        if(cont==parseInt(userInput)){
          this._stats.setUnidade(j);
          keepGoing=true;
        }
        cont++;
      }
    }   
    if(keepGoing==false){
      this._messageSender.sendSimpleMessage(recipientID, "VALOR INVÁLIDO! DIGITE UM DOS NÚMEROS DO MENU.");
      this._stats.delHistorico();
      var v=this._stats.getHistorico()[this._stats.getHistorico().length-1];
      console.log(v);
      this.sendList(recipientID, v[0]["text"], v[0], v[1]);      
    }else{   
      console.log(`SELECT dia FROM servicos_disponiveis WHERE unidade='${this._stats.getUnidade()}' AND nome='${this._stats.getServices()}' ORDER BY dia`);      
      this._database.query(`SELECT dia FROM servicos_disponiveis WHERE unidade='${this._stats.getUnidade()}' AND nome='${this._stats.getServices()}' ORDER BY dia`,(err, rows, inf)=>{
        if(!err){          
          var cont=1;              
          var mySet=new Set();    
          var dias = new Set();
          for(let inf of rows){               
            mySet.add(dateFormat(inf.dia, "yyyy-mm-dd"));       
            dias.add(dateFormat(inf.dia, "dd/mm/yyyy"));         
          }
          for(let inf of dias){
            textId+="\n*" + cont + "* - " + inf;                
            cont++;
          }
          textId+="\n*0* - Voltar";
          FileOperations.writeTemporary(Array.from(mySet), './src/public/temporary2.json');          
          this._messageSender.sendSimpleMessage(recipientID, textId);            
        }else{
            console.log('Erro ao realizar a consulta');
        }               
      }); 
      this._stats.setRecipient(i["send"]);    
    }
  }

  _selecaoHorarios(recipientID, textId, userInput, i){
    var cont=1;
    var keepGoing = false;
    for(let inf of FileOperations.readTemporary('./src/public/temporary2.json')){
      if(cont==parseInt(userInput)){
        this._stats.setDia(inf);
        keepGoing = true;
      }
      cont++;
    }            
    if(keepGoing==false){
      this._messageSender.sendSimpleMessage(recipientID, "VALOR INVÁLIDO! DIGITE UM DOS NÚMEROS DO MENU.");
      this._stats.delHistorico();
      var v=this._stats.getHistorico()[this._stats.getHistorico().length-1];
      console.log(v);
      this.sendList(recipientID, v[0]["text"], v[0], v[1]);      
    }else{
      console.log(`SELECT horario FROM servicos_disponiveis WHERE unidade='${this._stats.getUnidade()}' AND nome='${this._stats.getServices()}' AND dia='${this._stats.getDia()}' ORDER BY horario`);      
      this._database.query(`SELECT horario FROM servicos_disponiveis WHERE unidade='${this._stats.getUnidade()}' AND nome='${this._stats.getServices()}' AND dia='${this._stats.getDia()}' ORDER BY horario`,(err, rows, inf)=>{
        if(!err){          
          var cont=1;      
          var horarios=[];
          for(var inf of rows){                
            textId+="\n*" + cont + "* - " + inf.horario;      
            horarios.push(inf.horario);          
            cont++;
          }     
          textId+="\n*0* - Voltar";     
          FileOperations.writeTemporary(horarios, './src/public/temporary3.json');          
          this._messageSender.sendSimpleMessage(recipientID, textId);
            
        }else{
            console.log('Erro ao realizar a consulta');
        }               
      });
      this._stats.setRecipient(i["send"]);
    }
  }

  _transicao(recipientID, textId, userInput, i){
    var cont=1;
    var keepGoing = false;
    console.log(require('./src/public/temporary3.json'));
    for(let inf of require('./src/public/temporary3.json')){      
      if(cont==parseInt(userInput)){
        this._stats.setHorario(inf);        
        keepGoing = true; 
      }
      cont++;
    }    
    //NotificationSender.schedule(recipientID, dia, horario);
    if(keepGoing==false){
      this._messageSender.sendSimpleMessage(recipientID, "VALOR INVÁLIDO! DIGITE UM DOS NÚMEROS DO MENU.");
      this._stats.delHistorico();
      var v=this._stats.getHistorico()[this._stats.getHistorico().length-1];
      console.log(v);
      this.sendList(recipientID, v[0]["text"], v[0], v[1]);      
    }else{
      //var idUser=FileOperations.readTemporary('./src/public/temporaryUser.json');
      console.log(`INSERT INTO agendamentos(nome, unidade, horario, dia, id_usuario) VALUES( '${this._stats.getServices()}','${this._stats.getUnidade()}','${this._stats.getHorario()}','${this._stats.getDia()}','${1}')`)//idUser[0]["id_usuario"]
      this._database.query(`INSERT INTO agendamentos(nome, unidade, horario, dia, id_usuario, senderToken) VALUES( '${this._stats.getServices()}','${this._stats.getUnidade()}','${this._stats.getHorario()}','${this._stats.getDia()}','${1}','${recipientID}')`,(err, rows, inf)=>{
        if(!err){
          this._messageSender.sendSimpleMessage(recipientID, textId);
            setTimeout(() => {
            this._messageSender.sendMenu(recipientID, "texto_final");
            }, 1000);
          
        }else{
          console.log('Erro ao realizar a consulta');
        }               
      });
      console.log(`DELETE FROM servicos_disponiveis WHERE nome='${this._stats.getServices()}' AND unidade='${this._stats.getUnidade()}' AND horario='${this._stats.getHorario()}' AND dia='${this._stats.getDia()}'`);
      this._database.query(`DELETE FROM servicos_disponiveis WHERE nome='${this._stats.getServices()}' AND unidade='${this._stats.getUnidade()}' AND horario='${this._stats.getHorario()}' AND dia='${this._stats.getDia()}'`,(err, rows, inf)=>{
        if(err){     
          console.log('Erro ao realizar a consulta');
        }               
      });      
      this._stats.setHistorico([]);      
      this._stats.setRecipient(i["send"]);          
    }
  }

  _cancelamento(){
    var idUser=FileOperations.readTemporary('./src/public/temporaryUser.json');
    this._database.query(`DELETE FROM agendamentos WHERE id_usuario='${idUser[0]["id_usuario"]}'`,(err, rows, inf)=>{
      if(!err){
        console.log(rows);
      }else{
        console.log('Erro ao realizar a consulta');
      }               
    });
  }

  sendList(recipientID, textId, i, userInput){
    console.log("AAAAAAAAAAAA"+i["type"]);
    switch(i["type"]){
      case "selecao_unidades":
        this._selecaoUnidades(recipientID, textId, i)
        break;
      case "selecao_dias":            
        this._selecaoDias(recipientID, textId, userInput, i);
        break;
      case "selecao_horarios":            
        this._selecaoHorarios(recipientID, textId, userInput, i);
        break;
      case "transicao":        
        this._transicao(recipientID, textId, userInput, i);
        break;
      case "cancelamento":
        this._cancelamento();
        break;
      }        
  }
}
module.exports = QueriesSender;