import Vue from 'vue';
import Vuex from 'vuex';
import modules from './modules';
import http from "@/utils/http";

const baseURL = 'https://' + process.env.VUE_APP_NS_REALM + '.app.netsuite.com';

Vue.use(Vuex)

const state = {
    emailTemplates: [],
    savedSearches: [],

    form: {
        emailTemplateId: null,
        savedSearchId: null,

        emailAddresses: [],
    },

    previewTemplateModal: {
        selectedId: null,
        emailSubject: null,
        emailBody: null,
        open: false,
        loading: false,
    },

    previewEmailAddressModal: {
        selectedId: null,
        emailAddresses: [],
        open: false,
        loading: false,
    },

    globalModal: {
        open: false,
        title: '',
        body: '',
        busy: false,
        persistent: true,
        isError: false
    },

};

const getters = {
    globalModal: state => state.globalModal,
    emailTemplates: state => state.emailTemplates,
    savedSearches: state => state.savedSearches,
    form: state => state.form,
    previewTemplateModal: state => state.previewTemplateModal,
    previewEmailAddressModal: state => state.previewEmailAddressModal,
};

const mutations = {
    setGlobalModal: (state, open = true) => {
        state.globalModal.open = open;
    },
    displayErrorGlobalModal: (state, {title, message}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = false;
        state.globalModal.open = true;
        state.globalModal.persistent = true;
        state.globalModal.isError = true;
    },
    displayBusyGlobalModal: (state, {title, message, open}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = open;
        state.globalModal.open = open;
        state.globalModal.persistent = false;
        state.globalModal.isError = false;
    },
    displayInfoGlobalModal: (state, {title, message}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = false;
        state.globalModal.open = true;
        state.globalModal.persistent = false;
        state.globalModal.isError = false;
    }
};

const actions = {
    init: async context => {
        try {
            context.state.emailTemplates = await http.get('getAllEmailTemplates');
            context.state.savedSearches = await http.get('getAllSavedSearches');

            console.log(context.state);
        } catch (e) { console.error(e); }
    },
    handleException: (context, {title, message}) => {
        context.commit('displayErrorGlobalModal', {
            title, message
        })
    },
    previewEmailAddresses: async context => {
        if (!context.state.form.savedSearchId) {
            context.commit('displayErrorGlobalModal', {title: 'Saved Search Required', message: 'Please select a saved search first.'})
            return;
        }

        context.state.previewEmailAddressModal.loading = true;
        if (context.state.form.savedSearchId) context.state.previewEmailAddressModal.open = true;

        try {
            if (context.state.previewEmailAddressModal.selectedId !== context.state.form.savedSearchId) {
                context.state.previewEmailAddressModal.selectedId = context.state.form.savedSearchId;

                context.state.previewEmailAddressModal.emailAddresses = await http.get('getEmailAddressesFromSavedSearch', {
                    savedSearchId: context.state.form.savedSearchId
                });
            }
        } catch (e) { console.error(e); }

        context.state.previewEmailAddressModal.loading = false;
    },
    previewEmailTemplate : async context => {
        if (!context.state.form.emailTemplateId) {
            context.commit('displayErrorGlobalModal', {title: 'Email Template Required', message: 'Please select an email template first.'})
            return;
        }

        context.state.previewTemplateModal.loading = true;
        if (context.state.form.emailTemplateId) context.state.previewTemplateModal.open = true;

        try {
            if (context.state.previewTemplateModal.selectedId !== context.state.form.emailTemplateId) {
                let {emailSubject, emailBody} = await http.get('getEmailTemplate', {
                    emailTemplateId: context.state.form.emailTemplateId
                });

                context.state.previewTemplateModal.emailBody = emailBody;
                context.state.previewTemplateModal.emailSubject = emailSubject;
                context.state.previewTemplateModal.selectedId = context.state.form.emailTemplateId;
            }
        } catch (e) { console.error(e); }

        context.state.previewTemplateModal.loading = false;
    },
    sendTestEmail : async context => {
        if (!context.state.form.emailTemplateId) {
            context.commit('displayErrorGlobalModal', {title: 'Email Template Required', message: 'Please select an email template first.'})
            return;
        }
        try {
            context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Sending the selected email template to yourself...', open: true})

            let {recipient} = await http.post('sendTestEmail', {
                emailTemplateId: context.state.form.emailTemplateId
            });

            context.commit('displayInfoGlobalModal', {title: 'Done', message: 'A test email has been sent to <b>[' + recipient + ']</b>.'})
        } catch (e) { console.error(e); }
    },
    sendMassEmails : async context => {
        if (!context.state.form.emailTemplateId) {
            context.commit('displayErrorGlobalModal', {title: 'Email Template Required', message: 'Please select an email template first.'})
            return;
        }

        if (!context.state.form.savedSearchId) {
            context.commit('displayErrorGlobalModal', {title: 'Saved Search Required', message: 'Please select a saved search first.'})
            return;
        }

        try {
            context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Sending the selected email template to yourself...', open: true})

            let message = await http.post('sendMassEmails', {
                emailTemplateId: context.state.form.emailTemplateId,
                savedSearchId: context.state.form.savedSearchId,
            });

            context.commit('displayInfoGlobalModal', {title: 'Done', message})
        } catch (e) { console.error(e); }
    }
};

const store = new Vuex.Store({
    state,
    mutations,
    actions,
    getters,
    modules,
});

export default store;