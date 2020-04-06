<template>
  <div class="root">
    <v-app-bar app color="indigo" dark class="elevation-0" dense >
      <h3>TGMS Marketing</h3>
      <v-spacer></v-spacer>
      <v-btn text @click="removeAccounts" :disabled="!selectItems.length">
        <v-icon>mdi-close</v-icon>
        <span>remove</span>
      </v-btn>
      <v-btn text @click="performAction" :disabled="!selectItems.length">
        <v-icon>mdi-play</v-icon>
        <span>perform task</span>
      </v-btn>
      <v-btn text @click="adduserClick">
        <v-icon>mdi-plus</v-icon>
        <span>add account</span>
      </v-btn>
    </v-app-bar>
    <v-data-table :height="layout.height+'px'" :headers="headers"
    :items="accounts" :items-per-page="16" class="elevation-0" show-select dense
    :footer-props="{'items-per-page-options': [16]}" v-model="selectItems" item-key="session_id"></v-data-table>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Logic from '../logic';

export default {
  computed: mapState(['accounts']),
  data: () => ({
    headers: [
      { text: "Phone Number", value: "phone" },
      { text: "Username", value: "username" },
      { text: "First name", value: "firstname" },
      { text: "Last name", value: "lastname" }
    ],
    selectItems: [],

    layout: {
      height: 0,
    }
  }),

  methods: {
    updateLayout(){
      const h = window.innerHeight;
      this.layout.height = h - 87;
    },
    adduserClick(){
      window.showAddAccountForm()
    },
    performAction(){
      window.performAction(this.selectItems);
    },
    async removeAccounts(){
      if(await confirm('Are you sure you want to remove selected accounts?')){
        Logic.removeAccounts(this.selectItems);
        this.selectItems = []
      }
    }
  },

  created(){
    window.onresize = () => this.updateLayout();
    this.updateLayout();
  }
};
</script>

<style scoped>
.root{
  padding-top: 2px !important;
  background-color: white;
}
</style>

<style>
.v-data-table__wrapper{
  overflow-y: hidden !important;
}
</style>