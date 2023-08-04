import Vue from 'vue'
import App from './App.vue'
import store from './store'
import vuetify from './plugins/vuetify'

Vue.config.productionTip = false

if (parent['setMPTheme']) parent.setMPTheme('Mass Email Sender - NetSuite Australia (Mail Plus Pty Ltd)')

new Vue({
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
