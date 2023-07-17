import Vue from 'vue';
import Vuex from 'vuex';
import modules from './modules';
import http from "@/utils/http";

const baseURL = 'https://' + process.env.VUE_APP_NS_REALM + '.app.netsuite.com';

Vue.use(Vuex)

let progressTimer;

const state = {
    emailTemplates: [],
    savedSearches: [],

    form: {
        emailTemplateId: null,
        savedSearchId: null,
        customSubject: '',
        searchType: '',
        emailCount: '',
        busy: false,

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

    searchTypes: [
        {value: 'Customer', text: 'Customer'},
        {value: 'Contact', text: 'Contact'},
        {value: 'Franchisee', text: 'Franchisee'},
    ],

    progressStatus: {status: null, emailAddressCount: 0, remainingCount: 0, refreshCount: 0, averageProgressRate: 0}
};

const getters = {
    globalModal: state => state.globalModal,
    emailTemplates: state => state.emailTemplates,
    savedSearches: state => state.savedSearches,
    form: state => state.form,
    previewTemplateModal: state => state.previewTemplateModal,
    previewEmailAddressModal: state => state.previewEmailAddressModal,
    searchTypes: state => state.searchTypes,
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
    displayBusyGlobalModal: (state, {title, message, open = true}) => {
        state.globalModal.title = title;
        state.globalModal.body = message;
        state.globalModal.busy = open;
        state.globalModal.open = open;
        state.globalModal.persistent = true;
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
            await context.dispatch('checkProgress');
            progressTimer = setInterval(() => {context.dispatch('checkProgress')}, 5000);

            context.state.emailTemplates = await http.get('getAllEmailTemplates');
        } catch (e) { console.error(e); }
    },
    handleException: (context, {title, message}) => {
        context.commit('displayErrorGlobalModal', {
            title, message
        })
    },
    handleSearchTypeChanged: async context => {
        context.state.form.busy = true;

        context.state.form.savedSearchId = '';
        context.state.form.emailCount = '';
        context.state.savedSearches = await http.get('getSavedSearchesByType', {
            savedSearchType: context.state.form.searchType
        });

        context.state.form.busy = false;
    },
    handleSavedSearchIdChanged: async context => {
        context.state.form.busy = true;

        context.state.form.emailCount = await http.get('getEmailCountFromSavedSearch', {
            savedSearchType: context.state.form.searchType,
            savedSearchId: context.state.form.savedSearchId
        });

        context.state.form.busy = false;

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

        try {
            if (context.state.previewTemplateModal.selectedId !== context.state.form.emailTemplateId) {
                let {emailSubject, emailBody} = await http.get('getEmailTemplate', {
                    emailTemplateId: context.state.form.emailTemplateId
                });

                context.state.previewTemplateModal.emailBody = emailBody;
                context.state.previewTemplateModal.emailSubject = emailSubject;
                context.state.previewTemplateModal.selectedId = context.state.form.emailTemplateId;
                context.state.form.customSubject = emailSubject;
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
            context.commit('displayBusyGlobalModal', {title: 'Processing', message: 'Sending out emails according to selected saved search and email template...', open: true})

            let message = await http.post('sendMassEmails', {
                emailTemplateId: context.state.form.emailTemplateId,
                savedSearchId: context.state.form.savedSearchId,
                customSubject: context.state.form.customSubject,
                savedSearchType: context.state.form.searchType
            });

            context.commit('displayInfoGlobalModal', {title: 'Done', message})
        } catch (e) { console.error(e); }
    },
    checkProgress : async context => {
        let {status, emailAddressCount, remainingCount} = await http.get('getProgressStatus');
        let currentProgress = context.state.progressStatus;
        let progressText = _getProgressText(context, emailAddressCount, remainingCount);

        if (status === 'INDEXING')
            context.commit('displayBusyGlobalModal', {title: 'Email sending in progress', message: 'Email addresses in the saved search are being indexed...', open: true});
        else if (status === 'SENDING')
            context.commit('displayBusyGlobalModal', {title: 'Email sending in progress', message: 'Emails are being sent out... ' + progressText, open: true});
        else if (currentProgress.status !== null && currentProgress.status !== status && status === 'COMPLETED')
            context.commit('displayInfoGlobalModal', {title: 'Complete', message: emailAddressCount + ' emails were sent out.'});

        context.state.progressStatus.status = status;
        context.state.progressStatus.emailAddressCount = parseInt(emailAddressCount);
        context.state.progressStatus.remainingCount = parseInt(remainingCount);
    },
    stopCheckingProgress : () => {
        clearInterval(progressTimer);
    }
};

function _getProgressText(context, emailAddressCount, remainingCount) {
    let etaText = '';

    context.state.progressStatus.refreshCount++;

    let progressPerRefresh = context.state.progressStatus.remainingCount - parseInt(remainingCount);
    let progressPerSecond = progressPerRefresh / 5;

    if (progressPerRefresh > 0)
        context.state.progressStatus.averageProgressRate = (progressPerSecond + context.state.progressStatus.averageProgressRate) / 2;

    if (context.state.progressStatus.averageProgressRate) {
        let remainingTimeInSeconds = Math.round(parseInt(remainingCount) / context.state.progressStatus.averageProgressRate);

        let remainTimeText = _convertSecondsToHHMMSS(remainingTimeInSeconds);

        etaText += '. ETA: ' + remainTimeText;
    }
    return '(' + (parseInt(emailAddressCount) - parseInt(remainingCount)) + '/' + emailAddressCount + ' emails sent' + etaText + ')';
}

function _convertSecondsToHHMMSS(seconds, readable = false) {
    let remainder = seconds % 86400;
    let days = Math.floor(seconds / 86400);

    let timeString = new Date(remainder * 1000).toISOString().slice(11, 19);
    let [hh, mm, ss] = timeString.split(':')

    return readable ?
        (parseInt(hh) + days * 24) + ' hours ' + mm + ' minutes ' + ss + ' seconds' :
        (parseInt(hh) + days * 24) + ':' + mm + ':' + ss;
}

const store = new Vuex.Store({
    state,
    mutations,
    actions,
    getters,
    modules,
});

export default store;