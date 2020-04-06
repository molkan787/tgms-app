import TLBlob from '../TLBlob';

export default class UsersCreator{

    async do({ names, phoneProvider, apiKey }){
        const usedNames = [], unusedNames = [], tlNodes = [];
        for(let name of names){
            const phone = new phoneProvider(apiKey);
            const tlNode = new TLBlob();
            try {
                await this.createUser(name, phone, tlNode);
                tlNodes.push(tlNode);
                usedNames.push(name);
            } catch (error) {
                unusedNames.push(name);
                console.error(error);
            }
        }
        return tlNodes;
    }

    async createUser(name, phone, tlNode){
        const phoneNumber = await phone.getNumber();
        phone.on('codeReceived', code => tlNode.setCode(code));
        phone.on('waitCodeTimeout', () => tlNode.cancel());
        tlNode.on('requestUserData', cb => cb(name));
        phone.waitForCode();
        await tlNode.initSession(phoneNumber, { requireSmsCode: true });
    }

}