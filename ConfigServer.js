class ConfigServer{
    // Imports dependencies and set up http server
    constructor(){
        const
        express = require('express'),
        bodyParser = require('body-parser'),
        app = express().use(bodyParser.json()); // creates express http server
    }    

    setWebhook(){
        // Sets server port and logs message on success
        app.listen(process.env.PORT || 5000, () => console.log('webhook is listening'));

        // Creates the endpoint for our webhook 
        app.post('/webhook', (req, res) => {

        let body = req.body;

        // Checks this is an event from a page subscription
        if (body&&body.object === 'page') {

        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {

            // Gets the message. entry.messaging is an array, but 
            // will only ever contain one message, so we get index 0
            entry.messaging.forEach(function(event){
            if(event.message){
                trataMensagem(event);
            }else{
                if(event.postback && event.postback.payload){                
                sendMenu(event.sender.id, event.postback.payload, listaBotoes);
                }
            }
            });
            //console.log(webhook_event);
        });
        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
        } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
        }

        });

        // Adds support for GET requests to our webhook
        app.get('/webhook', (req, res) => {

        // Your verify token. Should be a random string.
        let VERIFY_TOKEN = "687697657567dxfsx";
        
        // Parse the query params
        let mode = req.query['hub.mode'];
        let token = req.query['hub.verify_token'];
        let challenge = req.query['hub.challenge'];
        
        // Checks if a token and mode is in the query string of the request
        if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            
            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        
        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);      
        }
        }
        });
    }
}