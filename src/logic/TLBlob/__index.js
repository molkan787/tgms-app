// const { MTProto } = req('telegram-mtproto');
// const { Storage } = req('mtproto-storage-fs');
const uuid = require('uuid');
const WithEvents = require('../Libs/WithEvents');
const ERRORS = require('./Errors');
const { p } = require('../utils');
const mStorage = require('../Storage');


module.exports = class TLBlob extends WithEvents{

    constructor(api, options){
        super();
        const { dev, sessionId } = (options || {});
        this.api = {
            layer           : 105,
            initConnection  : 0x69796de9,
            api_id          : api.id,
            api_hash        : api.hash
        };
        this.apiKeys = {
            api_id  : api.id,
            api_hash: api.hash,
        };

        const _sessionId = sessionId || uuid();
        const storageFilename = mStorage.sessionFilename(_sessionId);

        this.telegram = MTProto({
            api     : { api_id: this.api.api_id },
            server  : {
                dev: dev || false,
            },
            app: {
                storage: new Storage(storageFilename)
            }
        });

        this.state = {
            status: 0,
            activeData: {
                phone_number: '',
                phone_code_hash: '',
            }
        };

        this.sessionId = _sessionId;
    }

    async deleteAccount(reason){
        const resp = await this.telegram('account.deleteAccount', {reason});
        console.log(resp);
        return resp;
    }

    async sendCode(phoneNumber){
        this.state.activeData.phone_number = phoneNumber;
        const resp = await this.telegram('auth.sendCode', {
            phone_number  : phoneNumber,
            current_number: true,
            ...this.apiKeys
        });
        console.log('auth.sendCode resp:', resp)
        this.state.activeData.phone_code_hash = resp.phone_code_hash;
        return resp.phone_code_hash;
    }

    async resendCode(phone_number, phone_code_hash){
        if(typeof phone_number == 'undefined' || typeof phone_code_hash == 'undefined'){
            phone_number = this.state.activeData.phone_number;
            phone_code_hash = this.state.activeData.phone_code_hash;
        }
        const resp = await this.telegram('auth.resendCode', {
            phone_number,
            phone_code_hash,
            current_number: true,
            ...this.apiKeys,
        });
        console.log('auth.resendCode resp:', resp)
        return resp.phone_code_hash;
    }

    async signIn(phone_number, phone_code_hash, phone_code){
        const resp = await this.telegram('auth.signIn', {
            phone_number,
            phone_code_hash,
            phone_code,
        })
        this._status = TLBlob.STATUS_SIGNED_IN;
        return resp;
    }

    async signUp(phone_number, phone_code_hash, phone_code, userData){
        const { first_name, last_name } = userData;
        const resp = await this.telegram('auth.signUp', {
            phone_number,
            phone_code_hash,
            phone_code,
            first_name,
            last_name
        })
        this._status = TLBlob.STATUS_SIGNED_IN;
        return resp;
    }

    async initSession(phone_number){
        const code_hash = await this.sendCode(phone_number);
        const code = await this.requestPhoneCode();
        try {
            console.log('Signing in...');
            const resp = await this.signIn(phone_number, code_hash, code);
            this.user = resp.user;
            return resp;
        } catch (error) {
            if(error.type == ERRORS.PHONE_NUMBER_UNOCCUPIED){
                console.log('Phone No is not registered yet. Trying to sign up instead...');
                const userData = await this.requestUserData();
                const resp = await this.signUp(phone_number, code_hash, code, userData);
                this.user = resp.user;
                return resp;
            }else{
                console.log('Signing in failed.', error.type);
                throw error;
            }
        }
    }

    requestPhoneCode(){
        return p(r => this.$emit('requestCode', r));
    }

    requestUserData(){
        return p(r => this.$emit('requestUserData', r));
    }

    // -----------------------------------------------------------

    // -----------------------------------------------------------

    set _status(_s){
        this.state.status = _s;
    }

    get status(){
        return this.state.status;
    }

    static get STATUS_NULL(){ return 0 }
    static get STATUS_AUTH_CODE_SENT(){ return 1 }
    static get STATUS_SIGNED_IN(){ return 10 }

}