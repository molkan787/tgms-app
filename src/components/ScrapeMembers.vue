<template>
    <v-dialog v-model="open" max-width="400" persistent>
        <v-card>
            <v-card-title class="headline">Import users from group</v-card-title>
            <v-card-text style="padding-top: 10px">
                <p>Enter username of the Group/Channel</p>
                <v-text-field v-model="username" :disabled="loading" label="Username" hide-details dense outlined/>
                <v-select v-model="lastSeen" :items="lastSeenFilters" label="Last seen" hide-details dense outlined class="mrg-top"/>
                <v-btn @click="importClick" :loading="loading" class="btn elevation-0 mrg-top">Import</v-btn>
                <span class="note">*This operation may take a while</span>

            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="cancelClick">Cancel</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import ActionsPerformer from "../logic/ActionsPerfomer"
import Logic from '../logic'
export default {
    data:() => ({
        open: false,
        loading: false,
        username: '',
        lastSeen: -1,

        callback: null,

        lastSeenFilters: [
            {value: -1, text: 'All'},
            {value: 3600, text: '1 hour'},
            {value: 10800, text: '3 hour'},
            {value: 86400, text: '1 day'},
            {value: 259200, text: '3 day'},
            {value: 604800, text: '1 week'},
            {value: 1209600, text: '2 week'},
            {value: 1814400, text: '3 week'},
            {value: 2419200, text: '1 month'},
            {value: 4838400, text: '2 months'},
        ]
    }),
    methods: {
        async cancelClick(){
            if(!await confirm('Are you sure you want to cancel importation?')) return
            this.open = false;
            this.callback(null)
            this.callback = null
        },
        async importClick(){
            if(this.validateData()){
                this.loading = true
                try {
                    await this.startImport()
                } catch (error) {
                    console.log('Error from startImport()')
                    console.error(error)
                }
                this.loading = false
            }
        },
        validateData(){
            const minLen = 2;
            const u = this.username;
            if(u.length < minLen){
                alert('Please enter a username of the group/channel')
            }else if( ActionsPerformer.extractUsernameFromURL(u).length < minLen ){
                alert('Please enter the username in one of the following format: "@username" or "t.me/username"')
            }else{
                return true;
            }
            return false;
        },
        async startImport(){
            const users = await ActionsPerformer.scrapeGroupMembers({
                username: this.username,
                last_seen: this.lastSeen,
            })
            if(!this.callback) return
            if(users && users.length){
                const save = await confirm(`We have successfully imported ${users.length} users, Do you want to save them to a file?`)
                if(save) await Logic.exportUsersToFile(users)
                this.open = false;
                this.callback(users)
            }else{
                alert('We couldn\'t find any user on the specified Group/Channel.')
            }
            this.callback = null
        }
    },
    created() {
        window.scrapeGroupMembers = _ => new Promise((resolve) => {
            this.callback = resolve;
            this.username = '';
            this.working = false;
            this.open = true;
        })
  }
}
</script>

<style scoped>
.mrg-top{
  margin-top: 10px;
}
.btn {
  width: 100% !important;
  height: 50px !important;
}
.note{
    display: inline-block;
    margin-top: 10px;
    font-style: italic;
    font-size: 13px;
}
</style>