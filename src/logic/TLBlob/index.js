const { Airgram, toObject } = req('airgram')
const { UPDATE, AUTHORIZATION_STATE } = require('@airgram/constants')
const uuid = require('uuid');
const WithEvents = require('../Libs/WithEvents');
const ERRORS = require('./Errors');
const { p, waitUntil, sleep } = require('../utils');
const Storage = require('../Storage');

export default class TLBlob extends WithEvents {

    constructor(api, options) {
        super()
        const { dev, sessionId } = (options || {});
        const _sessionId = sessionId || uuid();
        const storageFilename = Storage.sessionFilename(_sessionId);
        // const TD_FILENAME = FileExtractor.getBaseFolderPath() + 'tdjson.dll';

        const airgram = new Airgram({
            useTestDc: dev,
            apiId: 1191275,
            apiHash: "cdb6dcdea06595374258cd57ec45b48a",
            command: TLBlob.TD_FILENAME,
            databaseDirectory: storageFilename,
            logVerbosityLevel: 0
        })
        airgram.on(UPDATE.updateAuthorizationState, (ctx, next) => this.onUpdateAuthorization(ctx, next));

        airgram.catch = err => console.error(err)

        this.airgram = airgram;
        this.sessionId = _sessionId;

        this._ = {
            cancel: false,
            cancelReason: 'CANCELLED',
            codeCallback: null,
            requireSmsCode: false,
        }
    }

    resetState(){
        this._.cancel = false;
        this._.cancelReason = 'CANCELLED';
    }

    async callApi (method, params) {
        const resp = await this.airgram.callApi({ method, params });
        if (resp.response._ == 'error') {
            console.log('Error on calling:', method, params)
            console.log('resp:', resp)
            throw resp.response.message;
        }
        return toObject(resp);
    }

    async initSession(phoneNumber, options) {
        this.resetState();
        const { requireSmsCode } = options || {};
        this._.requireSmsCode = requireSmsCode;
        await this.callApi('setAuthenticationPhoneNumber', { phoneNumber });
        await waitUntil(() => this.authorizationState == AUTHORIZATION_STATE.authorizationStateReady || this._.cancel);
        if(this._.cancel) throw this._.cancelReason;
        const user = await this.callApi('getMe');
        this.user = user;
        return user;
    }

    async checkVerificatinonCode(){
        const code = await this.requestPhoneCode();
        await this.callApi('checkAuthenticationCode', { code });
    }

    async resendVerificationCode(codeInfo){
        if(codeInfo.nextType === null){
            // If this function get called and nextType is null,
            // means we tried several times & couldn't get code sent via sms,
            // hence this error
            this.cancel('CODE_VIA_SMS_NOT_AVAILABLE');
            return;
        }
        await sleep((codeInfo.timeout + 5) * 1000);
        try {
            console.log('resending auth code...');
            await this.callApi('resendAuthenticationCode');
        } catch (error) {
            this.cancel(error);
        }
    }

    async onUpdateAuthorization({ update }, next) {
        const { authorizationState } = update
        this.authorizationState = authorizationState._;
        try {
            switch (authorizationState._) {
                case AUTHORIZATION_STATE.authorizationStateWaitCode: {
                    const { codeInfo } = authorizationState;
                    console.log('codeInfo:', codeInfo)
                    if(this._.requireSmsCode && codeInfo.type._ !== 'authenticationCodeTypeSms'){
                        this.resendVerificationCode(codeInfo);
                    }else{
                        await this.checkVerificatinonCode();
                    }
                    return next();
                }
                case AUTHORIZATION_STATE.authorizationStateWaitRegistration: {
                    const userData = await this.requestUserData();
                    console.log('userData', userData)
                    await this.callApi('registerUser', userData);
                    return next()
                }
                case AUTHORIZATION_STATE.authorizationStateReady: {
                    console.log('Success authorization!')
                    return next()
                }
                default: {
                    return next()
                }
            }
        } catch (error) {
            if(error == ERRORS.PHONE_CODE_INVALID){
                this.$emit('errorCodeInvalid')
                this.checkVerificatinonCode()
            }else{
                console.error(error)
                this.$emit('error', error)
            }
            return next()
        }
    }

    cancel(reason){
        this._.cancelReason = reason || 'CANCELLED';
        this._.cancel = true;
    }

    setCode(code){
        this._.codeCallback(code);
    }

    requestPhoneCode() {
        console.log('requestPhoneCode')
        return p(r => {
            this._.codeCallback = r;
            this.$emit('requestCode', r)
        });
    }

    requestUserData() {
        console.log('requestUserData')
        return p(r => this.$emit('requestUserData', r));
    }

    // -----------------------------------------------------

    async getPublicGroupMembers(username, limit){
        const group = await this.callApi('searchPublicChat', {username})
        const supergroupId = group.type && group.type.supergroupId
        if(!supergroupId) throw 'IS_NOT_SUPERGROUP'
        const members = []
        let count = 0
        while(true){
            const resp = await this.callApi('getSupergroupMembers',{
                supergroupId,
                offset: count,
                limit: 200
            })
            count += resp.members.length
            members.push(...resp.members)
            if(count >= resp.totalCount || limit && limit) break
            await sleep(1000)
        }
        return members
    }

    async addMembersToSupergroup(chatId, userIds, progress){
        await this.getAllChats()
        let i = 0
        for(let userId of userIds){
            try {
                await tlb.callApi('addChatMember', {chatId, userId})
            } catch (error) {
                console.error(error)
            }
            const time = Math.floor(Math.random() * 10000) + 30000
            await sleep(time)
            i++
            progress(i)
        }
    }

    getAllChats(){
        return this.callApi('getChats', {limit: 999999, offsetOrder: '9223372036854775807'});
    }

    async joinChatByUsername(username){
        const chat = await this.callApi('searchPublicChat', {username});
        return await this.callApi('joinChat', {chatId: chat.id})
    }

    async viewMessageByURL(url){
        const info = await this.callApi('getMessageLinkInfo', { url })
        const chatId = info.chatId;
        const msgId = info.message.id;
        await this.callApi('openChat', { chatId });

        const resp = await this.callApi('viewMessages', {
            chatId,
            messageIds: [msgId],
            forceRead: true
        })

        await sleep(300);
        await this.callApi('closeChat', { chatId });
    }

    untilReady(){
        return waitUntil(() => this.authorizationState == AUTHORIZATION_STATE.authorizationStateReady);
    }




    // ----------------

    async destroy(){
        await this.callApi('close')
        await waitUntil(() => this.authorizationState == AUTHORIZATION_STATE.authorizationStateClosed);
        this.airgram.provider.client.pause();
        await sleep(100);
        this.airgram.provider.client.destroy()
    }

}