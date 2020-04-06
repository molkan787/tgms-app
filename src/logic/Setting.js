class Setting{

    constructor(){
        this.data = {
            SMS_API_KEY: '',
        }
        for(let key in this.data){
            const val = window.localStorage.getItem('setting_' + key);
            if(val !== null) this.data[key] = val;
        }
    }

    get(name){
        return this.data[name];
    }

    set(name, value){
        this.data[name] = value;
        window.localStorage.setItem('setting_' + name, value);
    }
}

export default new Setting();