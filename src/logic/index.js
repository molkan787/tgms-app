import TLBlob from './TLBlob'
import TLWebNode from './TLWebNode'
import config from './config'
import Storage from './Storage'
import FileExtractor from './FileExtractor'
import Testing from './TESTING'
import Utils from './utils'
const path = req('path');

window.config = config;
// window.TLBlob = TLBlob;
window.Storage = Storage;
window.TLWebNode = TLWebNode

export default class Logic{

    static async init(store, dataDir){
        window.Logic = this;
        this.store = store;
        Storage.init(dataDir);
        Testing.init(store, this);
        FileExtractor.setBaseFolderPath(dataDir);
        TLBlob.TD_FILENAME = path.join(dataDir, 'tdjson.dll');
        await FileExtractor.extractIfNotExist([
            'data.db',
            'tdjson.dll',
            'SSLEAY32.dll',
            'LIBEAY32.dll',
            'zlib1.dll'
        ]);
        await this.loadData();
        Testing.doTests();
    }

    static async loadData(){
        await Storage.load();
        
        const accounts = await Storage.db.select('accounts', null, {desc: 'id'});
        this.store.state.accounts.push(...accounts)
    }

    static async removeAccounts(accounts){
        for(let account of accounts){
            await Storage.db.delete('accounts', { session_id: account.session_id })
            const index = this.store.state.accounts.indexOf(account);
            if(index != -1){
                this.store.state.accounts.splice(index, 1);
            }
        }
    }

    static async addAccount(data, session_id){
        let account = {
            phone: data.phoneNumber,
            username: data.username,
            firstname: data.firstName,
            lastname: data.lastName,
            session_id: session_id,
        }
        const id = await Storage.db.insert('accounts', account);
        account.id = id;
        this.store.state.accounts.unshift(account);
        return account;
    }

    static async addAccountFromTLBlob(tlb){
        const account = await this.addAccount(tlb.user, tlb.sessionId);
        account.tlb = tlb;
        return account;
    }

    static async addAccountFromTLWebNode(twn){
        const account = await this.addAccount(twn.user, twn.sessionId);
        account.twn = twn;
        return account;
    }

    static async getAccountTLBlob(account){
        if(account.tlb){
            return account.tlb;
        }else{
            const tlb = await this.loadTLBlobSession(account.session_id);
            account.tlb = tlb;
            return tlb;
        }
    }

    static async getAccountTLWebNode(account){
        if(account.twn){
            return account.twn;
        }else{
            const twn = await this.loadTLWebNodeSession(account.session_id);
            account.twn = twn;
            return twn;
        }
    }

    static newTLBlob(){
        return new TLBlob(config.telegramAPI, { dev: config.dev });
    }

    static newTLWebNode(){
        return new TLWebNode();
    }

    static loadTLBlobSession(sessionId){
        return new TLBlob(config.telegramAPI, {
            dev: config.dev,
            sessionId
        });
    }

    static loadTLWebNodeSession(sessionId){
        return new TLWebNode({sessionId})
    }

    static accountExist(phone){
        const accounts = this.store.state.accounts;
        const l = accounts.length;
        for(let i = 0; i < l; i++){
            if(accounts[i].phone == phone){
                return true;
            }
        }
        return false;
    }
    
    static async importUsersFromFile(){
        const filename = await Utils.promptFile()
        if(!filename) return null;
        const str = await Utils.readFile(filename)
        let users = str.split("\n")
        users = users.filter(u => u)
        return users
    }

    static async exportUsersToFile(users){
        const data = users.join("\n")
        const filename = await Utils.promptSaveFile()
        await Utils.writeFile(filename, data)
    }

}

console.log('Method added: removeAccounts')