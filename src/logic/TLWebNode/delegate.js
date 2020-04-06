export default `
(function(){
    window.$td = {
        sleep(time){
            return new Promise(r => setTimeout(r, time))
        },

        async getMembers(){
            const chatId = $scope.chatID;
            const result = []
            let offset = 0
            while(true){
                const parts = await AppProfileManager.getChannelParticipants(chatId, null, 200, offset)
                if(!parts.length) break
                offset += parts.length
                result.push(...parts)
                await $td.sleep(2500)
            }
            return AppChatsManager.wrapParticipants(chatId, result);
        },

        getFoundPeer(username){
            const peers = $ImDialogsScope.foundPeers;
            for(let i = 0; i < peers.length; i++){
                const peer = peers[i]
                if(peer.username === username){
                    return {
                        peer,
                        index: i
                    }
                }
            }
            return null;
        },

        getFoundContact(username){
            const peers = $contactsScope.contacts;
            for(let i = 0; i < peers.length; i++){
                const peer = peers[i].user
                if(peer.username === username){
                    return {
                        peer,
                        index: i
                    }
                }
            }
            return null;
        },

        async getMe(){
            const resp = await MtpApiManager.invokeApi('users.getFullUser', {
                id: {_: 'inputUserSelf'}
            });
            return resp.user;
        }
    }
})()
`