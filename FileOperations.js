class FileOperations{
    constructor(){
        this.fs = require('fs');
    }
    static writeTemporary(x, path){
        let data = JSON.stringify(x, null, 2);
        this.fs.writeFile(path, data, (err) => {
            if (err) throw err;
            console.log('Data written to file');
        });
    }

    static readTemporary(path){
        var x = require(path);
        return x;
    }
}

module.exports = FileOperations;