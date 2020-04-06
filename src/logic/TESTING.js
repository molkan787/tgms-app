import { sleep } from "./utils";
import UsersCreator from './Agents/UsersCreator';
import SmsActivateRu from './PhoneProviders/SmsActivateRu';

export default class TESTING{

    static init(store, logic){
        this.store = store;
        this.state = store.state;
        this.logic = logic;
    }

    static doTests(){
        // this.loadSession();
        // this.createTLWebNode()
        window.UsersCreator = UsersCreator;
        window.SmsActivateRu = SmsActivateRu;

        const uc = window.uc = new UsersCreator();
        window.ucdo = () => uc.do({
            names: [
                {
                    firstName: 'Mark',
                    lastName: 'Lenzo'
                }
            ],
            phoneProvider: SmsActivateRu,
            apiKey: 'dccAA7A1b7d4654f69658Afbb3439cb1'
        });
    }

    static loadSession(){
        const account = this.state.accounts[0];
        const tlb = this.logic.loadTLBlobSession(account.session_id);
        window.tlb = tlb;
    }

    static async createTLWebNode(){
        const twn = new TLWebNode({sessionId: 'sess06'})
        window.twn = twn;
        twn.on('requestCode', cb => {
            window.requestCode = cb;
            console.log('requestCode emitted')
        })
        await twn.botter.navigate('http://localhost:8000/app/index.html')
        twn.win.show()
        twn.win.openDevTools()
    }

}

window.test = async () => {
    console.log('Gathering group members')
    const members = await tlb.getPublicGroupMembers('bitcoincashfork', 600)
    console.log(`Found ${members.length} member, Sleeping 5 seconds`)
    await sleep(5000)
    console.log('Adding users to group')
    await tlb.addMembersToSupergroup(-1001149327136, members.map(m => m.userId), p => console.log(`${p}/${members.length}`))
    console.log('Done')
}