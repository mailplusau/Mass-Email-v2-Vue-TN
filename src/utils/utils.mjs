const TASK_STATUS = {
    QUEUED: 'queued',
    SCHEDULED: 'scheduled',
    STARTING: 'starting',
    INDEXING: 'indexing',
    SENDING: 'sending',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    ERROR: 'error',
};

const TASK_TYPE = {
    CSV_IMPORT: 'CSV_IMPORT',
    ENTITY_DEDUPLICATION: 'ENTITY_DEDUPLICATION',
    MAP_REDUCE: 'MAP_REDUCE',
    QUERY: 'QUERY',
    RECORD_ACTION: 'RECORD_ACTION',
    SCHEDULED_SCRIPT: 'SCHEDULED_SCRIPT',
    SEARCH: 'SEARCH',
    SUITE_QL: 'SUITE_QL',
    WORKFLOW_TRIGGER: 'WORKFLOW_TRIGGER',
};

let mainTabNames = {
    HOME: 'home',
    HISTORY: 'history',
    HELP: 'help',
};

export const VARS = {
    TASK_STATUS,
    TASK_TYPE,

    mainTabNames,

    AUTHOR_NAME: process.env.VUE_APP_AUTHOR_NAME,
    AUTHOR_EMAIL: process.env.VUE_APP_AUTHOR_EMAIL,
};

export function debounce(fn, wait){
    let timer;
    return function(...args){
        if(timer) {
            clearTimeout(timer); // clear any pre-existing timer
        }
        const context = this; // get the current context
        timer = setTimeout(()=>{
            fn.apply(context, args); // call the function if time expires
        }, wait);
    }
}