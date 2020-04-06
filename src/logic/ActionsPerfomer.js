import Logic from './index';
import Store from '../store'
import { sleep, divideArray, splitArray, rndItem, delay, timestamp } from './utils';

export default class ActionsPerformer{

    static inviteToGroup(username, users, progress){
        const _username = this.extractUsernameFromURL(username)
        return this.parallelTasks('inviteToGroup', _username, users, progress)
    }

    static sendMessage(text, users, progress){
        return this.parallelTasks('sendMessageToUsers', text, users, progress)
    }

    static async parallelTasks(taskName, arg1, users, progress){
        const accounts = Store.state.accounts
        const chunks = splitArray(users, accounts.length)
        let stoping = false
        let index = -1
        let success = 0
        let failure = 0
        const promises = accounts.map(acc => {
            index++
            const idx = index
            const delayTime = index * 10000
            return delay(async () => {
                const twn = await Logic.getAccountTLWebNode(acc)
                return await twn[taskName](arg1, chunks[idx], isSuccess => {
                    isSuccess ? success++ : failure++
                    if(!stoping)
                        stoping = progress(success + failure)
                    return stoping
                })
            }, delayTime)
        })
        await Promise.all(promises)
        return {
            success,
            failure
        }
    }

    static async scrapeGroupMembers(args){
        const now = timestamp();
        const { username, last_seen } = args;
        const _username = this.extractUsernameFromURL(username)
        const account = rndItem(Store.state.accounts)
        const twn = await Logic.getAccountTLWebNode(account)
        let members = await twn.getSupergroupMembers(_username)
        console.log('members', members)
        members = members.filter(m => {
            const u = m.user;
            const recent = last_seen < 0 ? true : (now - u.sortStatus) < last_seen;
            return recent && m._ == 'channelParticipant' && u.username;
        })
        console.log('Filtered', members)
        return members.map(m => m.user.username)
    }

    static extractUsernameFromURL(url){
        const parts = url.replace('@', '').split('/');
        return parts[parts.length-1];
    }

    static async joinChat(accounts, url, progress){
        const username = this.extractUsernameFromURL(url);
        const stats = { success: 0, fail: 0 }
        const l = accounts.length;
        for(let i = 0; i < l; i++){
            const account = accounts[i];
            try {
                const tlb = await Logic.getAccountTLBlob(account);
                if(tlb.authorizationState == "authorizationStateWaitPhoneNumber"){
                    throw 'Invalid session';
                }
                await tlb.untilReady();
                await sleep(500);
                await tlb.joinChatByUsername(username);
                stats.success++;
            } catch (error) {
                console.error(error)
                stats.fail++;
            }
            if(progress(i+1)) break;
            await sleep(2000);
        }
        return stats;
    }

    static async viewPosts(accounts, allposts, progress){
        const stats = { success: 0, fail: 0 }
        const postsGroups = divideArray(allposts, 6)
        let stopRequested = false;
        let stepProg = 0;
        let prog = 0;
        for(let posts of postsGroups){
            const st = await this._viewPosts(accounts, posts, p => {
                prog = Math.floor( (stepProg + p) / postsGroups.length )
                stopRequested = progress(prog)
                return stopRequested;
            })
            stats.success += st.success
            stats.fail += st.fail;
            stepProg += accounts.length

            if(postsGroups.indexOf(posts) < postsGroups.length-1){
                for(let i = 0; i < (5 * 60); i++){ // sleep for 5 minute
                    stopRequested = progress(prog)
                    if(stopRequested) break;
                    await sleep(1000)
                }
            }
            if(stopRequested) break;
        }
        stats.success = Math.floor(stats.success / postsGroups.length)
        stats.fail = Math.floor(stats.fail / postsGroups.length)
        return stats;
    }

    static async _viewPosts(accounts, posts, progress){
        const stats = { success: 0, fail: 0 }
        const l = accounts.length;
        for(let i = 0; i < l; i++){
            const account = accounts[i];
            try {
                const tlb = await Logic.getAccountTLBlob(account);
                await sleep(500);
                for(let post of posts){
                    await tlb.viewMessageByURL(post);
                    await sleep(500);
                }
                stats.success++;
            } catch (error) {
                stats.fail++;
            }
            if(progress(i+1)) break;
            await sleep(1000);
        }
        return stats;
    }



}