const { app } = req('electron');
const path = req('path');
const Database = require('../Libs/Database');

class Storage{

    static init(dataDir){
        this.sessionsDir = path.join(dataDir, 'sessions');

        this.appDir = dataDir;
        this.db = null;
    }

    static async load(){
        const dbFile = path.join(this.appDir, 'data.db');
        this.db = new Database();
        await this.db.open(dbFile)
    }

    static sessionFilename(filename){
        return path.join(this.sessionsDir, filename);
    }

}

module.exports = Storage;