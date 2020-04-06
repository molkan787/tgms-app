<template>
  <v-dialog v-model="open" max-width="400" persistent>
    <v-card :loading="loading">
      <v-card-title class="headline">{{ title }}</v-card-title>

      <v-card-text style="padding-top: 10px">
        <template v-if="step == 'start'">
          <p>
            <strong>{{ accounts.length }} user(s)</strong> selected, Select an action to do
          </p>
          <v-btn class="elevation-0 btn" @click="setStep('joinChat')">Join Channel/Group</v-btn>
          <br />
          <v-btn class="elevation-0 btn" @click="setStep('viewPosts')">View posts</v-btn>
        </template>

        <template v-else-if="step == 'joinChat'">
          <p>Please insert a link of the group</p>
          <v-text-field v-model="form.chatURL" label="Channel/Group Link or username" :disabled="working" outlined dense hide-details />
          <v-btn class="elevation-0 btn" :loading="working" @click="joinChatClick">Start</v-btn>
          <strong>Progress: {{ progressText }}</strong>
        </template>

        <template v-else-if="step == 'viewPosts'">
          <p>Please insert a links of posts</p>
          <div class="posts_links_con" :class="{scrollY: form.posts.length > 4}">
            <v-text-field v-for="(post, index) in form.posts" :key="index"
            v-model="form.posts[index]" :placeholder="'Post link #' + index"
            :disabled="working" class="postRow" outlined dense hide-details />
          </div>

          <v-btn class="elevation-0 btn" :loading="working" @click="viewPostsClick">Start</v-btn>
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
import ActionsPerformer from "../logic/ActionsPerfomer";

export default {
  data: () => ({
    open: false,
    working: false,
    loading: false,
    requestStop: false,
    title: 'Perform action',
    step: 'viewPosts',

    accounts: [],
    form: {
        chatURL: '',
        posts: ['', '']
    },
    progress: 0
  }),
  computed: {
    progressText() {
        if(this.requestStop)
            return 'Stoping...';
        else if(!this.working)
            return '--';
        else
            return `${this.progress}/${this.accounts.length} users`;
    }
  },
  watch: {
      'form.posts': {
          deep: true,
          handler(){
              // if(this.form.posts.length >= 6) return;
              let avalaible = false;
              for(let post of this.form.posts){
                  if(!post){
                      avalaible = true;
                      break;
                  }
              }
              if(!avalaible){
                  this.form.posts.push('');
              }
          }
      }
  },
  methods: {
    clearForm() {
      this.form.chatURL = "";
      this.form.posts = ['', ''];
      this.progress = 0;
    },
    setStep(step) {
      this.step = step;
      if (step == "start") this.title = "Perform action";
      else if (step == "joinChat") this.title = "Join Channel/Group";
      else if (step == "viewPosts") this.title = "View posts";
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

    joinChatClick(){
        const url = ActionsPerformer.extractUsernameFromURL(this.form.chatURL);
        if(url.length > 2){
            this.working = true;
            this.startChatJoining();
        }else{
            alert('Please enter a valid channel/group URL or a Username', 'TGMS');
        }
    },
    viewPostsClick(){
        const posts = this.form.posts.filter(p => p.startsWith('https://t.me/') || p.startsWith('http://t.me/'));
        if(posts.length){
            this.working = true;
            this.startPostsViewing(posts);
        }else{
            alert('Please enter at least 1 valid post link.', 'TGMS');
        }
    },
    

    beginStopingProcedure() {
      this.requestStop = true;
      this.loading = true;
    },

    onProgress(val) {
      this.progress = val;
      return this.requestStop;
    },

    async startChatJoining() {
        const stats = await ActionsPerformer.joinChat(
            this.accounts,
            this.form.chatURL.trim(),
            val => this.onProgress(val)
        );
        if (stats.fail) {
            alert(`Action succeeded on ${stats.success} users and failed on ${stats.fail}.`, "Join Channel/Group");
        } else {
            alert(`Action succeeded on all users.`, "Join Channel/Group");
        }
        this.open = false;
    },

    async startPostsViewing(posts) {
        const stats = await ActionsPerformer.viewPosts(
            this.accounts,
            posts,
            val => this.onProgress(val)
        );
        if (stats.fail) {
            alert(`Action succeeded on ${stats.success} users and failed on ${stats.fail}.`, "View posts");
        } else {
            alert(`Action succeeded on all users.`, "View posts");
        }
        this.open = false;
    }
  },

  created() {
    window.performAction = accounts => {
        this.accounts = accounts;
        this.clearForm();
        this.setStep("start");
        this.working = false;
        this.loading = false;
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
.postRow{
    margin-top: 5px;
}
.posts_links_con{
  max-height: 200px !important;
}
.scrollY{
  overflow-x: hidden;
  overflow-y: scroll;
}
</style>