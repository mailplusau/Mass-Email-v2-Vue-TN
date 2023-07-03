/**
 * @author Tim Nguyen
 * @description NetSuite Experimentation - Mass Email Sender with Vue 2. The only purpose of this script is to expose NetSuite modules to the Vue app.
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @created 21/06/2023
 */

let modules = {};

const moduleNames = ['error', 'runtime', 'search', 'record', 'url', 'format', 'email', 'currentRecord'];

// eslint-disable-next-line no-undef
define(moduleNames.map(item => 'N/' + item), (...args) => {
        for (let [index, moduleName] of moduleNames.entries())
            modules[moduleName] = args[index];

        function pageInit() {
            console.log('Client script init.');
        }

        return { pageInit };
    }
);

// eslint-disable-next-line no-unused-vars
function _getClientModules() {
    return modules;
}