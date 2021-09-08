class NotificationSender{    
    static schedule(recipientID, x,y, z){
        var schedule = require('node-schedule');
        //var date = new Date(2021, 7, 29, 16, 50, 0);
        console.log(date+"AAAAAAAAAAAAA");
        var date = new Date(x.getFullYear(),x.getMonth(), x.getDay()-1, y.getHours(), y.getMinutes(),0);
        var j = schedule.scheduleJob(date, function(){
          var messageData = {
            recipient: {
              id: recipientID
            },
            message: {
              attachment: {
                type: "template",
                payload: {
                  template_type: "button",
                  text: "Olá, estou passando para lembrar do "+z+" agendado para amanhã às 15 horas. Você confima o agendamento?",
                  buttons: 
                  [
                    {
                      type:"postback",
                      title:"Sim, confirmo",
                      payload:"p_sim_confirmo"
                    },
                    {
                        type:"postback",
                        title:"Não poderei comparecer",
                        payload:"nao_confirmo"
                    }
                  ]
                }
              }
            }
          }
          callSendAPI(messageData);
        });
        console.log(j);  
    }
}

module.exports = NotificationSender;