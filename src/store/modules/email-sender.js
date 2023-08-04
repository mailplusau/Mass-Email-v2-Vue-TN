import http from "@/utils/http";
import {VARS} from "@/utils/utils";

const state = {
    savedSearches: [],
    emailTemplates: [],

    form: {
        emailTemplateId: null,
        savedSearchId: null,
        customSubject: '',
        searchType: '',
        emailCount: '',
        busy: false,

        emailAddresses: [],
    },

    emailTemplatePreview: {
        selectedId: null,
        emailSubject: '',
        emailBody: '',
        open: false,
        loading: false,
    },

    searchTypes: [
        {value: 'Customer', text: 'Customer', icon: 'mdi-account-star'},
        {value: 'Contact', text: 'Contact', icon: 'mdi-account-tie'},
        {value: 'Franchisee', text: 'Franchisee', icon: 'mdi-account-group'},
    ],
};

const getters = {
    form : state => state.form,
    searchTypes : state => state.searchTypes,
    savedSearches : state => state.savedSearches,
    emailTemplates : state => state.emailTemplates,
    emailTemplatePreview : state => state.emailTemplatePreview,
};

const mutations = {

};

const actions = {
    init: async context => {
        context.dispatch('getEmailTemplates').then();
    },
    getEmailTemplates : async context => {
        context.state.form.busy = true;
        context.state.emailTemplates = await http.get('getAllEmailTemplates');
        context.state.form.busy = false;
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
    handleEmailTemplateIdChanged : async context => {
        if (!context.state.form.emailTemplateId) return;

        context.state.emailTemplatePreview.loading = true;

        try {
            if (context.state.emailTemplatePreview.selectedId !== context.state.form.emailTemplateId) {
                let {emailSubject, emailBody} = await http.get('getEmailTemplate', {
                    emailTemplateId: context.state.form.emailTemplateId
                });

                context.state.emailTemplatePreview.emailBody = emailBody;
                context.state.emailTemplatePreview.emailSubject = emailSubject;
                context.state.emailTemplatePreview.selectedId = context.state.form.emailTemplateId;
                context.state.form.customSubject = emailSubject;
            }
        } catch (e) {
            console.error(e);
            context.state.emailTemplatePreview.selectedId = null;
            context.state.emailTemplatePreview.emailBody = '';
            context.state.emailTemplatePreview.emailSubject = '';
            context.state.form.customSubject = '';
        }

        context.state.emailTemplatePreview.loading = false;
    },
    sendMassEmails : async context => {
        if (!_validateSavedSearchAndEmailTemplate(context)) return;

        try {
            context.commit('displayBusyGlobalModal',
                {title: 'Processing', message: 'Sending out emails according to selected saved search and email template...'}, {root: true})

            let params = await http.get('getParametersForScheduler', {
                emailTemplateId: context.state.form.emailTemplateId,
                savedSearchId: context.state.form.savedSearchId,
                customSubject: context.state.form.customSubject,
                savedSearchType: context.state.form.searchType
            });

            let res = await http.post('dispatchSingleTask', {
                ...params
            }, {script: process.env.VUE_APP_NS_SCHEDULER_SCRIPT_ID, deploy: process.env.VUE_APP_NS_SCHEDULER_DEPLOY_ID});

            context.commit('displayInfoGlobalModal', {
                    title: 'Process Started',
                    message: `In a few seconds, email addresses present in the saved searched will be indexed and emails will be sent out. (${res})`
                }, {root: true});
        } catch (e) { console.error(e); }
    },
    scheduleMassEmails : async (context, dateObj) => {
        if (!_validateSavedSearchAndEmailTemplate(context)) return;

        try {
            context.commit('displayBusyGlobalModal',
                {title: 'Processing', message: 'Scheduling email to be sent out at the specified date and time...'}, {root: true});

            let params = await http.get('getParametersForScheduler', {
                emailTemplateId: context.state.form.emailTemplateId,
                savedSearchId: context.state.form.savedSearchId,
                customSubject: context.state.form.customSubject,
                savedSearchType: context.state.form.searchType
            });

            let res = await http.post('scheduleSingleTask', {
                scheduledTime: dateObj,
                ...params
            }, {script: process.env.VUE_APP_NS_SCHEDULER_SCRIPT_ID, deploy: process.env.VUE_APP_NS_SCHEDULER_DEPLOY_ID});

            context.commit('displayInfoGlobalModal',
                {title: 'Emails Scheduled', message: `Emails will be sent at the specified date and time. (${res})`}, {root: true});
        } catch (e) { console.error(e); }
    }
};

function _validateSavedSearchAndEmailTemplate(context) {
    if (!context.state.form.emailTemplateId) {
        context.commit('displayErrorGlobalModal',
            {title: 'Email Template Required', message: 'Please select an email template first.'}, {root: true});

        return false;
    }

    if (!context.state.form.savedSearchId) {
        context.commit('displayErrorGlobalModal',
            {title: 'Saved Search Required', message: 'Please select a saved search first.'}, {root: true});

        return false;
    }

    return true;
}

export default {
    state,
    getters,
    actions,
    mutations
};