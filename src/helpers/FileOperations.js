const fs = require('fs');
class FileOperations{ 
    static writeTemporary(x, path){
        let data = JSON.stringify(x, null, 2);
        fs.writeFile(path, data, (err) => {
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