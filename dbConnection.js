const mysql2 = require('mysql2');
const express = require('express');
class DbConection{
    constructor(){
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
        app.listen('3000', ()=>{
            console.log("Server started on port 3000");
        });
    }
    //Connect
    
    getConnection(){
        return this.connection;
    }
}

module.exports = DbConection;