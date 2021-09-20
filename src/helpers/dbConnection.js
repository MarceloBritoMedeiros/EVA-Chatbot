const mysql2 = require('mysql2');
const express = require('express');
class DbConection{
    constructor(port){
        this._port=port;
        this.connection = mysql2.createConnection({
            host :'localhost',
            user :'root',
            password:'28150_NNMM',
            database: 'uai'
        });        
    }    

    setConnection(){
        this.connection.connect((err)=>{
            if(err){
                throw err;
            }
            console.log('MySql Connected...');
        });
        const app=express();
        app.listen(this._port, ()=>{
            console.log("Server started on port "+this._port);
        });
    }
    //Connect
    
    getConnection(){
        return this.connection;
    }
}

module.exports = DbConection;