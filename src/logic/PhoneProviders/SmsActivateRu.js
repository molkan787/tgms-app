import WithEvents from '../Libs/WithEvents';
import axios from 'axios';
import { sleep } from '../utils';
const API_BASE_URL = 'http://sms-activate.ru/stubs/handler_api.php?api_key=';

export default class SmsActivateRu extends WithEvents{

    constructor(apiKey){
        super();
        this.API_KEY = apiKey;
        this.state = {
            orderId: '',
            phoneNumber: ''
        }
    }

    async getNumber(){
        const { data } = await this.query({
            action: 'getNumber',
            service: 'tg'
        });
        if(typeof data !== 'string') throw new Error('Received invalid data type.');
        const parts = data.split(':');
        if(parts[0] !== 'ACCESS_NUMBER') throw data;
        this.state.orderId = parts[1];
        this.state.phoneNumber = parts[2];
        return parts[2];
    }

    async waitForCode(){
        const interval = 30; // seconds
        const timeout = 60 * 10 // 10 minutes
        let current = 0;
        while(true){
            const code = await this.getCode();
            if(code){
                this.$emit('codeReceived', code);
                return code;
            }
            current += interval;
            if(current >= timeout){
                this.$emit('waitCodeTimeout');
                return null;
            }
            await sleep(interval * 1000) // * 1000 converting seconds to millis
        }
    }

    async getCode(){
        const { data } = await this.query({
            action: 'getStatus',
            id: this.state.orderId
        });
        if(typeof data !== 'string') return null;
        const parts = data.split(':');
        if(parts[0] === 'STATUS_OK'){
            return parts[1];
        }else{
            return null;
        }
    }
    
    // ---------------------------------------------

    query(params){
        const query = this._buildQuery(params);
        return axios.get(query);
    }

    _buildQuery(params){
        let query = API_BASE_URL + this.API_KEY;
        for(let name in params){
            if(!params.hasOwnProperty(name)) continue;
            query += `&${name}=${params[name]}`
        }
        return query;
    }

}