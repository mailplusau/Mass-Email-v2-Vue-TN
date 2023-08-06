import http from "@/utils/http";
import {VARS} from "@/utils/utils";

const state = {
    data: [],
    loading: false,
    filter: {},
};

const getters = {
    data : state => state.data,
    loading : state => state.loading,
    filter : state => state.filter,
};

const mutations = {
    selectAllFilters : state => {
        for (let status in VARS.TASK_STATUS)
            state.filter[VARS.TASK_STATUS[status]] = true;
    },
    deselectAllFilters : state => {
        for (let status in VARS.TASK_STATUS)
            state.filter[VARS.TASK_STATUS[status]] = false;
    },
    reverseAllFilters : state => {
        for (let status in VARS.TASK_STATUS)
            state.filter[VARS.TASK_STATUS[status]] = !state.filter[VARS.TASK_STATUS[status]];
    },
    showAllPending : state => {
        for (let status in VARS.TASK_STATUS)
            state.filter[VARS.TASK_STATUS[status]] = [VARS.TASK_STATUS.QUEUED, VARS.TASK_STATUS.SCHEDULED].includes(VARS.TASK_STATUS[status]);
    },
    showAllInProgress : state => {
        for (let status in VARS.TASK_STATUS)
            state.filter[VARS.TASK_STATUS[status]] = [VARS.TASK_STATUS.STARTING, VARS.TASK_STATUS.INDEXING, VARS.TASK_STATUS.SENDING].includes(VARS.TASK_STATUS[status]);
    },
    showAllCompleted : state => {
        for (let status in VARS.TASK_STATUS)
            state.filter[VARS.TASK_STATUS[status]] = [VARS.TASK_STATUS.COMPLETED].includes(VARS.TASK_STATUS[status]);
    },
    showAllCancelled : state => {
        for (let status in VARS.TASK_STATUS)
            state.filter[VARS.TASK_STATUS[status]] = [VARS.TASK_STATUS.CANCELLED, VARS.TASK_STATUS.ERROR].includes(VARS.TASK_STATUS[status]);
    },
};

const actions = {
    init : async context => {
        await context.dispatch('getAllTasks');
        context.commit('selectAllFilters');
    },
    getAllTasks : async context => {
        context.state.loading = true;
        let data = await http.get('getAllTasks');
        if (Array.isArray(data)) context.state.data = [...data]
        context.state.loading = false;
    },
    cancelTask : async (context, taskId) => {//cancelSingleTask
        context.commit('displayBusyGlobalModal',
            {title: 'Cancelling task', message: 'Please wait while the pending email is being cancelled...', open: true}, {root: true});

        let res = await http.post('cancelSingleTask', {taskId},
            {script: process.env.VUE_APP_NS_SCHEDULER_SCRIPT_ID, deploy: process.env.VUE_APP_NS_SCHEDULER_DEPLOY_ID});

        context.state.data = await http.get('getAllTasks');

        context.commit('displayInfoGlobalModal',
            {title: 'Done', message: `Email is no longer queued for sending. ${res}`}, {root: true});
    },
};

for (let status in VARS.TASK_STATUS) state.filter[VARS.TASK_STATUS[status]] = true;

export default {
    state,
    getters,
    actions,
    mutations
};