const FileOperations = require("C:/Users/marce/Docs/Desenvolvimento/UaiForce/messenger-webhook/src/helpers/FileOperations.js");
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

  _semHorarios(recipientID, cont){
    if(cont==1){
      this._messageSender.sendSimpleMessage(recipientID, "Não há horários disponíveis");
      this._messageSender.sendTextMessage(recipientID, "0");
      return false;
    }
    return true;
  }
  _valorInvalido(recipientID){
    this._messageSender.sendSimpleMessage(recipientID, "VALOR INVÁLIDO! DIGITE UM DOS NÚMEROS DO MENU.");
    this._stats.delHistorico();
    var v=this._stats.getHistorico()[this._stats.getHistorico().length-1];
    this._stats.setRecipient(v[0]);
    this.sendList(recipientID, v[1]); 
  }

  _selecaoUnidades(recipientID){
    var textId=`Certo, então você precisa agendar a ${this._stats.getServices()}. Agora, preciso que escolha uma das unidades abaixo.`
    console.log(`SELECT DISTINCT UNIDADE FROM servicos_disponiveis WHERE nome='${this._stats.getServices()}' ORDER BY nome`);
    this._database.query(`SELECT DISTINCT UNIDADE FROM servicos_disponiveis WHERE nome='${this._stats.getServices()}' ORDER BY nome`, (err, rows, inf)=>{       
      var cont=1; 
      var unidades = [];         
      if(!err){
        for(var j of rows){            
          textId+="\n*"+cont+"* - "+j.UNIDADE;   
          unidades.push(j.UNIDADE);           
          cont++;
        }        
        textId+="\n*0* - Voltar";  
        var temHorario = this._semHorarios(recipientID, cont);
        if(temHorario==true){
          FileOperations.writeTemporary(unidades, "C:/Users/marce/Docs/Desenvolvimento/UaiForce/messenger-webhook/src/public/unidades.json");    
          setTimeout(() => {
            this._messageSender.sendSimpleMessage(recipientID, textId);  
          }, 1000); 
        }                                 
      }else{
          console.log('Erro ao realizar a consulta');
      }          
    });     
    this._stats.setRecipient(this._stats.getTypeInput()[this._stats.getTypeInput().indexOf(this._stats.getRecipient())+1]);           
  }

  _selecaoDias(recipientID, userInput){
    var cont=1;
    var keepGoing = false;
    if(this._stats.getUnidade()!="Belo Horizonte"){
      for(let j of FileOperations.readTemporary("C:/Users/marce/Docs/Desenvolvimento/UaiForce/messenger-webhook/src/public/unidades.json")){
        if(cont==parseInt(userInput)){
          this._stats.setUnidade(j);
          keepGoing=true;
        }
        cont++;
      }
    }else{
      keepGoing=true;
    }
    var textId=`Ok, abaixo estão os dias disponíveis para a unidade ${this._stats.getUnidade()}.`
    if(keepGoing==false){
      this._valorInvalido(recipientID); 
    }else{   
      console.log(`SELECT DISTINCT dia FROM servicos_disponiveis WHERE unidade='${this._stats.getUnidade()}' AND nome='${this._stats.getServices()}' ORDER BY dia`);      
      this._database.query(`SELECT DISTINCT dia FROM servicos_disponiveis WHERE unidade='${this._stats.getUnidade()}' AND nome='${this._stats.getServices()}' ORDER BY dia`,(err, rows, inf)=>{
        if(!err){
          var cont=1;        
          var dias = [];          
          for(let inf of rows){            
            textId+="\n*" + cont + "* - " + dateFormat(inf.dia, "dd/mm/yyyy");   
            dias.push(dateFormat(inf.dia, "yyyy-mm-dd"));
            cont++;
          }
          textId+="\n*0* - Voltar";
          FileOperations.writeTemporary(dias, "C:/Users/marce/Docs/Desenvolvimento/UaiForce/messenger-webhook/src/public/dias.json");      
          setTimeout(() => {
            this._messageSender.sendSimpleMessage(recipientID, textId);      
          }, 1000);                    
        }else{
            console.log('Erro ao realizar a consulta');
        }               
      }); 
      this._stats.setRecipient(this._stats.getTypeInput()[this._stats.getTypeInput().indexOf(this._stats.getRecipient())+1]);    
    }
  }

  _selecaoHorarios(recipientID, userInput){
    var cont=1;
    var keepGoing = false;
    for(let inf of FileOperations.readTemporary("C:/Users/marce/Docs/Desenvolvimento/UaiForce/messenger-webhook/src/public/dias.json")){
      if(cont==parseInt(userInput)){
        this._stats.setDia(inf);
        keepGoing = true;
      }
      cont++;
    }            
    var textId="Certo, agora escolha um dos horários disponíveis.";
    if(keepGoing==false){
      this._valorInvalido(recipientID);
    }else{
      console.log(`SELECT horario FROM servicos_disponiveis WHERE unidade='${this._stats.getUnidade()}' AND nome='${this._stats.getServices()}' AND dia='${this._stats.getDia()}' ORDER BY horario`);      
      this._database.query(`SELECT horario FROM servicos_disponiveis WHERE unidade='${this._stats.getUnidade()}' AND nome='${this._stats.getServices()}' AND dia='${this._stats.getDia()}' ORDER BY horario`,(err, rows, inf)=>{
        if(!err){ 
          var cont=1;
          var horarios=[];
          for(var inf of rows){                
            textId+="\n*" + cont + "* - " + inf.horario.slice(0,5);      
            horarios.push(inf.horario);          
            cont++;
          }     

          textId+="\n*0* - Voltar";     
          FileOperations.writeTemporary(horarios, 'C:/Users/marce/Docs/Desenvolvimento/UaiForce/messenger-webhook/src/public/horarios.json');      
          setTimeout(() => {
            this._messageSender.sendSimpleMessage(recipientID, textId);
          }, 1000);            
        }else{
            console.log('Erro ao realizar a consulta');
        }               
      });
      this._stats.setRecipient(this._stats.getTypeInput()[this._stats.getTypeInput().indexOf(this._stats.getRecipient())+1]);
    }
  }  

  _transicao(recipientID, userInput){
    var cont=1;
    var keepGoing = false;    
    for(let inf of require('C:/Users/marce/Docs/Desenvolvimento/UaiForce/messenger-webhook/src/public/horarios.json')){      
      if(cont==parseInt(userInput)){
        this._stats.setHorario(inf);        
        keepGoing = true; 
      }
      cont++;
    }     
    if(keepGoing==false){
      this._valorInvalido(recipientID);
    }else{
      var xx=this._stats.getDia().split('-')
      var data = `${xx[2]}/${xx[1]}/${xx[0]}`      
      var string = `Confira as informações do agendamento abaixo. Posso confirmar?\n\nServiço: ${this._stats.getServices()}\nUnidade: ${this._stats.getUnidade()}\nData: ${data}\nHorário: ${this._stats.getHorario().slice(0,5)}`
      this._messageSender.sendMenu(recipientID, "pergunta_final", string)      
    }    
  }

  inserir(recipientID){
    var idUser=FileOperations.readTemporary('C:/Users/marce/Docs/Desenvolvimento/UaiForce/messenger-webhook/src/public/temporaryUser.json');
    var informacoes=FileOperations.readTemporary('C:/Users/marce/Docs/Desenvolvimento/UaiForce/messenger-webhook/src/public/listTextOutput.json');
    console.log(`INSERT INTO agendamentos(nome, unidade, horario, dia, id_usuario) VALUES( '${this._stats.getServices()}','${this._stats.getUnidade()}','${this._stats.getHorario()}','${this._stats.getDia()}','${idUser[0]["id_usuario"]}')`)
    this._database.query(`INSERT INTO agendamentos(nome, unidade, horario, dia, id_usuario, senderToken) VALUES( '${this._stats.getServices()}','${this._stats.getUnidade()}','${this._stats.getHorario()}','${this._stats.getDia()}','${idUser[0]["id_usuario"]}','${recipientID}')`,(err, rows, inf)=>{
      if(err){
        console.log('Erro ao realizar a consulta');
      }               
    });
    console.log(`DELETE FROM servicos_disponiveis WHERE nome='${this._stats.getServices()}' AND unidade='${this._stats.getUnidade()}' AND horario='${this._stats.getHorario()}' AND dia='${this._stats.getDia()}'`);
    this._database.query(`DELETE FROM servicos_disponiveis WHERE nome='${this._stats.getServices()}' AND unidade='${this._stats.getUnidade()}' AND horario='${this._stats.getHorario()}' AND dia='${this._stats.getDia()}'`,(err, rows, inf)=>{
      if(err){     
        console.log('Erro ao realizar a consulta');
      }               
    });     
    for(var i of Object.keys(informacoes)){
      if(i==this._stats.getServices()){
        this._messageSender.sendSimpleMessage(recipientID, informacoes[i]); 
        break;
      }
    } 
    this._stats.setHistorico([]); 
  }
  _cancelamento(){
    var idUser=FileOperations.readTemporary('C:/Users/marce/Docs/Desenvolvimento/UaiForce/messenger-webhook/src/public/temporaryUser.json');
    this._database.query(`DELETE FROM agendamentos WHERE id_usuario='${idUser[0]["id_usuario"]}'`,(err, rows, inf)=>{
      if(!err){
        console.log(rows);
      }else{
        console.log('Erro ao realizar a consulta');
      }               
    });
  }

  sendList(recipientID, userInput){    
    switch(this._stats.getRecipient()){
      case "selecao_unidades":
        this._selecaoUnidades(recipientID)
        break;
      case "selecao_dias":            
        this._selecaoDias(recipientID, userInput);
        break;
      case "selecao_horarios":            
        this._selecaoHorarios(recipientID, userInput);
        break;
      case "transicao":        
        this._transicao(recipientID, userInput);
        break;
      case "cancelamento":
        this._cancelamento();
        break;
      }        
  }
}
module.exports = QueriesSender;