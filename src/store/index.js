import Vue from 'vue';
import Vuex from 'vuex';
import modules from './modules';

const baseURL = 'https://' + process.env.VUE_APP_NS_REALM + '.app.netsuite.com';

Vue.use(Vuex);

const state = {
    globalModal: {
        open: false,
        title: 'Default title',
        body: 'This is a global modal that will deliver notification on global level.',
        busy: false,
        progress: -1,
        persistent: true,
        isError: false
    },

    mainTab: 'home'
};

const getters = {
    globalModal : state => state.globalModal,
    mainTab : state => state.mainTab,
};

const mutations = {
    setMainTab : (state, tab) => { state.mainTab = tab; },
    displayErrorGlobalModal: (state, {title, message}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = false;
        state.globalModal.open = true;
        state.globalModal.progress = -1;
        state.globalModal.persistent = true;
        state.globalModal.isError = true;
    },
    displayBusyGlobalModal: (state, {title, message, open = true, progress = -1}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = open;
        state.globalModal.open = open;
        state.globalModal.progress = progress;
        state.globalModal.persistent = true;
        state.globalModal.isError = false;
    },
    displayInfoGlobalModal: (state, {title, message, persistent = false}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = false;
        state.globalModal.open = true;
        state.globalModal.progress = -1;
        state.globalModal.persistent = persistent;
        state.globalModal.isError = false;
    }
};

const actions = {
    addShortcut : () => {
        parent?.window?.addShortcut()
    },
    init : async context => {
        if (!_checkNetSuiteEnv()) return;

        await context.dispatch('email-sender/init');
        await context.dispatch('email-history/init');
    },
    handleException: (context, {title, message}) => {
        context.commit('displayErrorGlobalModal', {
            title, message
        })
    },
};

function _checkNetSuiteEnv() {
    if (parent['getCurrentNetSuiteUrl']) {
        return parent.getCurrentNetSuiteUrl().includes(baseURL);
    } else return false;
}

const store = new Vuex.Store({
    state,
    mutations,
    actions,
    getters,
    modules,
});

export default store;