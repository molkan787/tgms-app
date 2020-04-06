<template>
  <v-dialog v-model="open" max-width="400" persistent>
    <v-card :loading="loading">
      <v-card-title class="headline">{{ title }}</v-card-title>

      <v-card-text style="padding-top: 10px">

        <template v-if="step == 'pre-start'">
          <p>
            <strong>Import users to perform action on</strong>
          </p>
          <v-btn class="elevation-0 btn" @click="loadUsersFromFile" :loading="loading2">Import from file</v-btn>
          <v-btn class="elevation-0 btn" @click="scrapeMembers">Import from Telegram Group</v-btn>
          <v-btn class="elevation-0 btn" v-if="users.length" @click="setStep('start')">
            Previously imported (<strong>{{users.length}} users</strong>)
          </v-btn>
        </template>

        <template v-else-if="step == 'start'">
          <p>
            <strong>{{ users.length }} user(s)</strong> selected, Select an action to do
          </p>
          <v-btn class="elevation-0 btn" @click="setStep('invite')">Invite to Channel/Group</v-btn>
          <br />
          <v-btn class="elevation-0 btn" @click="setStep('message')">Send Message</v-btn>
        </template>

        <template v-else-if="step == 'invite'">
          <p>Enter username of the Group/Channel</p>
          <v-text-field v-model="form.chatURL" :disabled="working" label="Username" hide-details dense outlined/>
          <v-select v-model="inviteIntr" class="mrt" :items="intervals" :disabled="working" label="Interval" outlined dense ></v-select>
          <v-btn @click="startInviting" :loading="working" class="btn elevation-0">Start inviting</v-btn>
          <strong>Progress: {{ progressText }}</strong>
        </template>

        <template v-else-if="step == 'message'">
          <p>Enter the message to send</p>
          <v-textarea v-model="form.message" :disabled="working" label="Message" hide-details dense outlined/>
          <v-select v-model="messageIntr" class="mrt" :items="intervals" :disabled="working" label="Interval" outlined dense ></v-select>
          <v-btn @click="startSending" :loading="working" class="btn elevation-0">Start sending</v-btn>
          <strong>Progress: {{ progressText }}</strong>
        </template>

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
import { mapState } from 'vuex'

export default {
  data: () => ({
    open: false,
    working: false,
    loading: false,
    loading2: false, 
    requestStop: false,
    title: 'Perform action',
    step: 'message',//'pre-start',
    form: {
        chatURL: '',
        message: ''
    },
    progress: 0,

    inviteIntr: 300,
    messageIntr: 420,

    intervals: [
      {text: '1 minute', value: 60},
      {text: '1 minutes 30 secs', value: 90},
      {text: '2 minutes', value: 120},
      {text: '3 minutes', value: 180},
      {text: '4 minutes', value: 240},
      {text: '5 minutes', value: 300},
      {text: '7 minutes', value: 420},
      {text: '10 minutes', value: 600},
    ]
  }),
  computed: {
    ...mapState(['users']),
    progressText() {
        if(this.requestStop)
            return 'Stoping...';
        else if(!this.working)
            return '--';
        else
            return `${this.progress}/${this.users.length} users`;
    }
  },
  methods: {
    async loadUsersFromFile(){
      this.loading2 = true
      try {
        const users = await Logic.importUsersFromFile()
        if(users && users.length){
          this.setUsers(users)
        }
      } catch (error) {
        console.error(error)
        alert('An error occured when trying to import users.', 'Error')
      }
      this.loading2 = false
      
    },
    async startInviting(){
      if(ActionsPerformer.extractUsernameFromURL(this.form.chatURL).length < 2) {
        alert('Please enter the username in one of the following format: "@username" or "t.me/username"')
        return
      }
      this.working = true
      this.$store.state.inviteInterval = this.inviteIntr
      const result = await ActionsPerformer.inviteToGroup(this.form.chatURL, this.users, v => this.onProgress(v))
      await alert(`Task completed with ${result.success} success and ${result.failure} failure.`, 'Completed')
      this.open = false
    },
    async startSending(){
      if(this.form.message.length < 3) {
        alert('Please enter a message longer than 2 letters.')
        return
      }
      this.working = true
      this.$store.state.messageInterval = this.messageIntr
      const result = await ActionsPerformer.sendMessage(this.form.message, this.users, v => this.onProgress(v))
      await alert(`Task completed with ${result.success} success and ${result.failure} failure.`, 'Completed')
      this.open = false
    },
    async scrapeMembers(){
      const users = await scrapeGroupMembers()
      if(users && users.length){
        this.setUsers(users)
      }
    },
    setUsers(users){
      this.$store.state.users = users;
      this.setStep('start')
    },
    clearForm() {
      this.form.chatURL = '';
      this.form.message = '';
      this.progress = 0;
    },
    setStep(step) {
      this.step = step;
      if (step == "pre-start") this.title = "Import users";
      else if (step == "start") this.title = "Perform task";
      else if (step == "invite") this.title = "Invite to Group/Channel";
      else if (step == "message") this.title = "Send message";
    },
    async cancelClick() {
      if (this.working) {
        if (
          await confirm("Are you sure you want to cancel the current action?")
        ) {
          this.beginStopingProcedure();
        }
      } else {
        this.open = false;
      }
    },

    

    beginStopingProcedure() {
      this.requestStop = true;
      this.loading = true;
      setTimeout(() => this.open = false, 1000)
    },

    onProgress(val) {
      this.progress = val;
      return this.requestStop;
    },

  },

  created() {
    window.performAction = accounts => {
        this.accounts = accounts;
        this.clearForm();
        this.setStep("pre-start");
        this.working = false;
        this.loading = false;
        this.loading2 = false;
        this.requestStop = false;
        this.open = true;
    };
  }
};
</script>

<style scoped>
.btn {
  width: 100% !important;
  margin-top: 10px;
  height: 50px !important;
}
.mrt{
  margin-top: 20px;
}
.scrollY{
  overflow-x: hidden;
  overflow-y: scroll;
}
</style>