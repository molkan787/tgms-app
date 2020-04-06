import WithEvents from '../Libs/WithEvents'
import Botter from '../Libs/Botter'
import Store from '../../store'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import uuid from 'uuid'
import TC from './Constants'
import delegate from './delegate'
import { p, sleep, rnd, rndSleep } from '../utils'
const { BrowserWindow } = req('electron')
const path = req('path')
window.parsePhoneNumberFromString = parsePhoneNumberFromString

export default class TLWebNode extends WithEvents{

    constructor(options){
        super()
        const { sessionId } = options || {}
        this.sessionId = sessionId || uuid();
        const win = this._createBrowserWindow()
        this.botter = new Botter(win)
        this.botter.allwaysExec(delegate)
    }

    async login(phoneNumber){
        const b = this.botter
        const { countryCallingCode, nationalNumber } = parsePhoneNumberFromString(phoneNumber)
        await b.navigate(TC.BASE_URL)
        await rndSleep(3000, 5000)
        await b.setValue(TC.SEL_LOGIN_COUNTRYCODE, countryCallingCode)
        await rndSleep(400, 800)
        await b.setValue(TC.SEL_LOGIN_NUMBER, nationalNumber)
        await rndSleep(1000, 1500)
        await b.clickElement(TC.SEL_LOGIN_NEXT)
        await rndSleep(1000, 2000)
        await b.clickElement(TC.SEL_LOGIN_OK)
        await b.waitForElement(TC.SEL_LOGIN_CODE, Botter.Appear)
        let success = false
        for(let i = 0; i < 3; i++){ // Try 3 times to enter verificatino code
            const code = await this._requestPhoneCode()
            await rndSleep(1000, 2000)
            await b.setValue(TC.SEL_LOGIN_CODE, code)
            await sleep(3000)
            if(await b.countElements(TC.SEL_LOGIN_INCORRECT_CODE) === 0){
                success = true
                break
            }else{
                this.$emit('errorCodeInvalid')
            }
        }
        if(success) {
            await b.waitForElement(TC.SEL_HOME_ELEMENT, Botter.Appear)
            const user = await b.exec('$td.getMe()')
            this.user = {
                phoneNumber: user.phone,
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name,
            }
        }

        return success
    }

    async getSupergroupMembers(username){
        const b = this.botter
        await this.openPeer(username)
        await rndSleep(3000, 6000)
        await b.clickElement(TC.SEL_PEER_HEAD)
        await b.waitForElement(TC.SEL_MEMBERS_AREA, Botter.Appear)
        await sleep(2000)
        return await b.exec('$td.getMembers(0)')
    }

    
    async inviteToGroup(groupUsername, users, progress){
        console.log('Inviting', users)
        const intr = Store.state.inviteInterval
        const minIntr = Math.floor((intr * 0.75) * 1000)
        const maxIntr = Math.floor((intr * 1.25) * 1000)
        await this.openPeer(groupUsername)
        await rndSleep(2000, 5000)
        for(let user of users){
            let success = false
            try {
                success = await this.inviteUser(user)
            } catch (error) {
            }
            
            if(success){
                if(progress(true)) // reporting Success, progress() return true if a stop was requested
                    break
            }else{
                if(progress(false)) // reporting Failure
                    break
                await rndSleep(2000, 5000)
                await this.openPeer(groupUsername)
            }
            await rndSleep(minIntr, maxIntr)
        }
    }

    async sendMessageToUsers(text, recipients, progress){
        console.log('Sending message to', recipients)
        const intr = Store.state.messageInterval
        const minIntr = Math.floor((intr * 0.75) * 1000)
        const maxIntr = Math.floor((intr * 1.25) * 1000)
        await this.botter.navigate(TC.HOME_URL)
        await sleep(2000)
        for(let recipient of recipients){
            try {
                await this.sendMessage(recipient, text)
                if(progress(true)) // reporting Success
                    break
            } catch (error) {
                if(progress(false)) // reporting Failure
                    break
            }
            await rndSleep(minIntr, maxIntr)
        }
    }

    async sendMessage(recipient, text){
        const b = this.botter
        await b.setValue(TC.SEL_SEARCHBOX, '@' + recipient)
        await rndSleep(3000, 4000)
        const foundPeer = await b.exec(`$td.getFoundPeer("${recipient}")`)
        await b.clickElement(TC.SEL_SEARCH_IMDIALOG, foundPeer ? foundPeer.index : undefined)
        await rndSleep(4000, 8000)
        await b.setValue(TC.SEL_MESSAGE_INPUT, text)
        await rndSleep(500, 2000)
        await b.clickElement(TC.SEL_SUBMIT_MESSAGE_BTN)
        await sleep(500)
    }

    async inviteUser(username){
        const b = this.botter
        await b.clickElement(TC.SEL_PEER_HEAD)
        await b.waitForElement(TC.SEL_INVITE_BTN, Botter.Appear)
        await rndSleep(1000, 2000)
        await b.clickElement(TC.SEL_INVITE_BTN)
        await sleep(3000)
        await b.clickElement(TC.SEL_SEARCHBOX, 1)
        await sleep(200)
        await b.writeText('@' + username)
        await rndSleep(7000, 15000)
        const contact = await b.exec(`$td.getFoundContact("${username}")`)
        await b.clickElement(TC.SEL_CONTACT_ITEM, contact ? contact.index : undefined)
        await rndSleep(5000, 10000)
        await b.clickElement(TC.SEL_SUBMIT_SELECTED_BTN)
        await sleep(3000)
        const modalsCount = await b.countElements(TC.SEL_MODAL_CLOSE_PAN)
        return (modalsCount === 0)
    }


    openPeer(username){
        return this.botter.navigate(TC.PEER_BASE_URL + username)
    }


    // ======================================================

    _requestPhoneCode() {
        return p(r => this.$emit('requestCode', r));
    }

    _createBrowserWindow(){
        const win = new BrowserWindow({
            show: false, width: 1366, height: 768,
            paintWhenInitiallyHidden: false,
            webPreferences: {
                preload: path.resolve('delegate.js'),
                partition: `persist:${this.sessionId}`
            }
        })
        this.win = win;
        return win;
    }

}
