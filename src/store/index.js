import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    accounts: [],
    users: [],
    inviteInterval: 300, // in Seconds
    messageInterval: 420 // in Seconds
  },
  mutations: {
  },
  actions: {
  },
  modules: {
  }
})
