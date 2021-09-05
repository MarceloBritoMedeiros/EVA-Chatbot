const FileOperations = require('./FileOperations');
const MessageSender = require('./MessageSender');
dateFormat = require('dateformat');

class QueriesSender{  
  constructor(stats,database, messageSender){
      this._recipientID;
      this._textID;
      this._userInput;
      this._stats = stats;
      this._database=database;
      this._messageSender = messageSender;        
      //this._notificationSender = new NotificationSender();      
  }    

  sendList(recipientID, textId, i, userInput){
      if(i["type"]=="selecao_unidades"){
        console.log(`SELECT UNIDADE FROM servicos_disponiveis WHERE nome='${this._stats.getServices()}'`);
        this._database.query(`SELECT UNIDADE FROM servicos_disponiveis WHERE nome='${this._stats.getServices()}'`, (err, rows, inf)=>{       
          var cont=1;
          var lset=[];
          if(!err){
            var mySet=new Set();   
            for(var j of rows){
              mySet.add(j.UNIDADE);             
            } 
            for(var j of mySet){            
              textId+="\n"+cont+" - "+j;
              lset.push(j);
              cont++;
            }        
            FileOperations.writeTemporary(lset, './src/public/temporary.json');                
            this._messageSender.sendSimpleMessage(recipientID, textId);        
          }else{
              console.log('Erro ao realizar a consulta');
          }          
        });  
      }else if(i["type"]=="selecao_horarios"){            
          var cont=1;
          if(this._stats.getUnidade()!="Belo Horizonte"){
            for(let j of FileOperations.readTemporary('./src/public/temporary.json')){
              if(cont==parseInt(userInput)){
                this._stats.setUnidade(j);
              }
              cont++;
            }
          }      
          console.log(`SELECT horario, dia FROM servicos_disponiveis WHERE unidade='${this._stats.getUnidade()}' AND nome='${this._stats.getServices()}'`);      
          this._database.query(`SELECT horario, dia FROM servicos_disponiveis WHERE unidade='${this._stats.getUnidade()}' AND nome='${this._stats.getServices()}'`,(err, rows, inf)=>{
            if(!err){          
              var cont=1;   
              var horarios=[]              
              for(var j of rows){                
                textId+="\n" + cont + " - " + j.horario + " " +dateFormat(j.dia, "dd/mm/yyyy");
                horarios.push([j.horario,j.dia]);
                cont++;
              }
              FileOperations.writeTemporary(horarios, './src/public/temporary2.json');          
              this._messageSender.sendSimpleMessage(recipientID, textId);
                
            }else{
                console.log('Erro ao realizar a consulta');
            }               
          });    
      }else if(i["type"]=="transicao"){        
        cont=1;
        console.log(require('./src/public/temporary2.json'));
        for(let j of require('./src/public/temporary2.json')){      
          if(cont==parseInt(userInput)){
            this._stats.setHorario(j[0]);
            this._stats.setDia(dateFormat(j[1],"yyyy-mm-dd"));
          }
          cont++;
        }    
        //NotificationSender.schedule(recipientID, dia, horario);
        var idUser=FileOperations.readTemporary('./src/public/temporaryUser.json');
        console.log(`INSERT INTO agendamentos(nome, unidade, horario, dia, id_usuario) VALUES( '${this._stats.getServices()}','${this._stats.getUnidade()}','${this._stats.getHorario()}','${this._stats.getDia()}','${idUser[0]["id_usuario"]}')`)
        this._database.query(`INSERT INTO agendamentos(nome, unidade, horario, dia, id_usuario) VALUES( '${this._stats.getServices()}','${this._stats.getUnidade()}','${this._stats.getHorario()}','${this._stats.getDia()}','${idUser[0]["id_usuario"]}')`,(err, rows, inf)=>{
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
      }else if(i["type"]=="cancelamento"){
        var idUser=FileOperations.readTemporary('./src/public/temporaryUser.json');
        this._database.query(`SELECT * FROM agendamentos WHERE id_usuario='${idUser[0]["id_usuario"]}'`,(err, rows, inf)=>{
          if(!err){              
            console.log(rows);
          }else{
            console.log('Erro ao realizar a consulta');
          }               
        });
      }
      this._stats.setServico(i["send"]);
    }
}

module.exports = QueriesSender;