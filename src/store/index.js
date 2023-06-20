import Vue from 'vue';
import Vuex from 'vuex';
import modules from './modules';
import http from "@/utils/http";

const baseURL = 'https://' + process.env.VUE_APP_NS_REALM + '.app.netsuite.com';

Vue.use(Vuex)

const state = {

};

const getters = {

};

const mutations = {

};

const actions = {
    init: async context => {

    },
};

const store = new Vuex.Store({
    state,
    mutations,
    actions,
    getters,
    modules,
});

export default store;