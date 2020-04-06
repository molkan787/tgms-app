import Vue from 'vue'
import App from './App.vue'
import store from './store'
import Logic from './logic'
import vuetify from './plugins/vuetify';
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import '@mdi/font/css/materialdesignicons.css'
import './styles/main.css'

Vue.config.productionTip = false

// Logic.init(store)

global.startInit = dataDir => Logic.init(store, dataDir)

new Vue({
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')

const path = req('path')
console.log(path.resolve('./TLWebNode'))
