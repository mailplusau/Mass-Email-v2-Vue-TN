/**
 * @author Tim Nguyen
 * @description NetSuite Experimentation - Mass Email Sender with Vue 2
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @created 21/06/2023
 */

// This should be the same file as the one built by webpack. Make sure this matches the filename in package.json
let htmlTemplateFile = 'mp_cl_mass_email_tn_v2_vue.html';
const clientScriptFilename = 'mp_cl_mass_email_tn_v2_vue.js';
const defaultTitle = 'Mass Email Sender';

let NS_MODULES = {};

let EMAIL_TEMPLATE_FIELDS = [
    "_csrf",
    "_eml_nkey_",
    "addcompanyaddress",
    "addunsubscribelink",
    "content",
    "entryformquerystring",
    "id",
    "isautoconverted",
    "isinactive",
    "isprivate",
    "name",
    "nsapiCT",
    "numchildrecords",
    "restrictaccess",
    "scriptid",
    "subject",
    "sys_id",
    "templatetype",
    "templateversion",
    "type",
    "typename",
    "usesmedia",
    "nsapiPI",
    "nsapiSR",
    "nsapiVF",
    "nsapiFC",
    "nsapiPS",
    "nsapiVI",
    "nsapiVD",
    "nsapiPD",
    "nsapiVL",
    "nsapiRC",
    "nsapiLI",
    "nsapiLC",
    "nsbrowserenv",
    "wfPI",
    "wfSR",
    "wfVF",
    "wfFC",
    "wfPS",
    "_multibtnstate_",
    "selectedtab",
    "externalid",
    "whence",
    "customwhence",
    "wfinstances",
    "publisherid",
    "package",
    "recordtype",
    "description",
    "helpmemo",
    "dummy0-2",
    "mediaitem",
    "dummy0-10",
    "dummy4",
    "dummy4-1",
    "mergetypestpl_en",
    "mergefieldstpl_en",
    "dummy5",
    "dummy6",
    "restricttogroup",
    "campaigndomain"
];


define(['N/ui/serverWidget', 'N/render', 'N/search', 'N/file', 'N/log', 'N/record', 'N/email', 'N/runtime', 'N/https', 'N/task', 'N/format', 'N/url'],
    (serverWidget, render, search, file, log, record, email, runtime, https, task, format, url) => {
    NS_MODULES = {serverWidget, render, search, file, log, record, email, runtime, https, task, format, url};
    
    const onRequest = ({request, response}) => {
        if (request.method === "GET") {

            if (!_handleGETRequests(request.parameters['requestData'], response)){
                // Render the page using either inline form or standalone page
                // _getStandalonePage(response)
                _getInlineForm(response)
            }

        } else if (request.method === "POST") { // Request method should be POST (?)
            _handlePOSTRequests(JSON.parse(request.body), response);
            // _writeResponseJson(response, {test: 'test response from post', params: request.parameters, body: request.body});
        } else {
            log.debug({
                title: "request method type",
                details: `method : ${request.method}`,
            });
        }

    }

    return {onRequest};
});

// Render the page within a form element of NetSuite. This can cause conflict with NetSuite's stylesheets.
function _getInlineForm(response) {
    let {serverWidget, render, file} = NS_MODULES;
    
    // Create a NetSuite form
    let form = serverWidget.createForm({ title: defaultTitle });

    // Then create form field in which we will render our html template
    let htmlField = form.addField({
        id: "custpage_html",
        label: "html",
        type: serverWidget.FieldType.INLINEHTML,
    });
    
    const pageRenderer = render.create();
    const htmlFileData = _getHtmlTemplate(htmlTemplateFile);
    const htmlFile = file.load({ id: htmlFileData[htmlTemplateFile].id });
    pageRenderer.templateContent = htmlFile.getContents();
    htmlField.defaultValue = pageRenderer.renderAsString();

    // Retrieve client script ID using its file name.
    form.clientScriptFileId = _getHtmlTemplate(clientScriptFilename)[clientScriptFilename].id;

    response.writePage(form);
}

// Render the htmlTemplateFile as a standalone page without any of NetSuite's baggage. However, this also means no
// NetSuite module will be exposed to the Vue app. Thus, an api approach using Axios and structuring this Suitelet as
// a http request handler will be necessary. For reference:
// https://medium.com/@vladimir.aca/how-to-vuetify-your-suitelet-on-netsuite-part-2-axios-http-3e8e731ac07c
function _getStandalonePage(response) {
    let {render, file} = NS_MODULES;

    // Create renderer to render our html template
    const pageRenderer = render.create();

    // Get the id and url of our html template file
    const htmlFileData = _getHtmlTemplate(htmlTemplateFile);

    // Load the  html file and store it in htmlFile
    const htmlFile = file.load({
        id: htmlFileData[htmlTemplateFile].id
    });

    // Load the content of the html file into the renderer
    pageRenderer.templateContent = htmlFile.getContents();

    response.write(pageRenderer.renderAsString());
}

// Search for the ID and URL of a given file name inside the NetSuite file cabinet
function _getHtmlTemplate(htmlPageName) {
    let {search} = NS_MODULES;

    const htmlPageData = {};

    search.create({
        type: 'file',
        filters: ['name', 'is', htmlPageName],
        columns: ['name', 'url']
    }).run().each(resultSet => {
        htmlPageData[resultSet.getValue({ name: 'name' })] = {
            url: resultSet.getValue({ name: 'url' }),
            id: resultSet.id
        };
        return true;
    });

    return htmlPageData;
}


function _handleGETRequests(request, response) {
    if (!request) return false;

    let {log} = NS_MODULES;

    try {
        let {operation, requestParams} = JSON.parse(request);

        if (!operation) throw 'No operation specified.';

        if (!getOperations[operation]) throw `Operation [${operation}] is not supported.`;

        getOperations[operation](response, requestParams);
    } catch (e) {
        log.debug({title: "_handleGETRequests", details: `error: ${e}`});
        _writeResponseJson(response, {error: `${e}`})
    }

    return true;
}

function _handlePOSTRequests({operation, requestParams}, response) {
    let {log} = NS_MODULES;

    try {
        if (!operation) throw 'No operation specified.';

        // _writeResponseJson(response, {source: '_handlePOSTRequests', operation, requestParams});
        postOperations[operation](response, requestParams);
    } catch (e) {
        log.debug({title: "_handlePOSTRequests", details: `error: ${e}`});
        _writeResponseJson(response, {error: `${e}`})
    }
}

function _writeResponseJson(response, body) {
    response.write({ output: JSON.stringify(body) });
    response.addHeader({
        name: 'Content-Type',
        value: 'application/json; charset=utf-8'
    });
}

const getOperations = {
    'getAllEmailTemplates' : function (response) {
        let {search} = NS_MODULES;
        let data = [];
        let columnNames = ['internalid', 'name', 'custrecord_camp_comm_subject', 'custrecord_camp_comm_email_template'];

        search.create({
            type: 'customrecord_camp_comm_template',
            filters: [
                {name: 'isinactive', operator: 'is', values: false}
            ],
            columns: columnNames.map(item => ({name: item}))
        }).run().each(result => {
            let tmp = {};

            for (let column of result.columns)
                tmp[column.name] = result.getValue(column);

            data.push(tmp);

            return true;
        });

        _writeResponseJson(response, data);
    },
    'getAllSavedSearches' : function (response) {
        let {search} = NS_MODULES;

        let data = [];
        let columnNames = ['id', 'title', 'recordtype', 'frombundle', 'owner', 'access', 'lastrunby', 'lastrunon'];

        search.create({
            type: search.Type['SAVED_SEARCH'],
            filters: [
                {name: 'recordtype', operator: 'anyof', values: ['Customer', 'Contact']},
            ],
            columns: columnNames.map(item => ({name: item}))
        }).run().each(result => {
            let tmp = {};

            for (let column of result.columns)
                tmp[column.name] = result.getValue(column);

            data.push(tmp);

            return true;
        });

        _writeResponseJson(response, data);
    },
    'getSavedSearchesByType' : function (response, {savedSearchType}) {
        let {search} = NS_MODULES;
        let data = [];
        let columnNames = ['id', 'title', 'recordtype', 'frombundle', 'owner', 'access', 'lastrunby', 'lastrunon'];

        if (['Customer', 'Contact'].includes(savedSearchType))
            search.create({
                type: search.Type['SAVED_SEARCH'],
                filters: [
                    {name: 'recordtype', operator: 'anyof', values: [savedSearchType]},
                ],
                columns: columnNames.map(item => ({name: item}))
            }).run().each(result => {
                data.push({
                    value: result.getValue('id'),
                    text: result.getValue('title')
                });

                return true;
            });
        else if (['Franchisee'].includes(savedSearchType))
            search.create({
                type: "partner",
                filters:
                    [
                        ["isinactive","is","F"],
                        "AND",
                        ["entityid","doesnotstartwith","Old"],
                        "AND",
                        ["custrecord_fr_agreement_franchisee.custrecord_fr_agreement_status","noneof","6"]
                    ],
                columns: ['internalid', 'companyname', 'department', 'location']
            }).run().each(result => {
                data.push({
                    value: result.getValue('internalid'),
                    text: result.getValue('companyname')
                });

                return true;
            });

        _writeResponseJson(response, data);
    },
    'getEmailAddressesFromSavedSearch' : function (response, {savedSearchId}) {
        _writeResponseJson(response, sharedFunctions.getEmailAddressesFromSavedSearch(savedSearchId));
    },
    'getEmailTemplate' : function (response, {emailTemplateId}) {
        _writeResponseJson(response, sharedFunctions.getEmailTemplate(emailTemplateId));
    }
}

const postOperations = {
    'sendTestEmail' : function (response, {emailTemplateId, customSubject = ''}) {
        let {runtime, email} = NS_MODULES;
        let {emailSubject, emailBody} = sharedFunctions.getEmailTemplate(emailTemplateId);

        email.sendBulk({
            author: 112209,
            recipients: [runtime.getCurrentUser().email],
            subject: customSubject || emailSubject,
            body: emailBody,
            isInternalOnly: true
        });

        _writeResponseJson(response, {recipient: runtime.getCurrentUser().email});
    },
    'sendMassEmails' : function (response, {savedSearchId, emailTemplateId, customSubject = '', savedSearchType}) {
        let {file, task, search} = NS_MODULES;

        // We check if this saved search has any field that can contain email address
        if (['Customer', 'Contact'].includes(savedSearchType)) {
            let fieldsToCheck = ['email', 'custentity_email_service', 'custentity_email_sales'];
            let emailAddressSearch = search.load({id: savedSearchId});
            let searchColumns = emailAddressSearch.columns.map(item => item.name);
            let fieldsToGet = _getArrayIntersection(fieldsToCheck, searchColumns);

            if (!fieldsToGet.length) {
                _writeResponseJson(response, 'No email was sent. Saved search contain no email address.');
                return
            }
        }

        let fileContent = {timestamp: Date.now(), emails: [], customSubject, emailTemplateId, authorId: 112209};

        // noinspection JSVoidFunctionReturnValueUsed
        let fileId = file.create({
            name: `mp_sc_mass_email_params.json`,
            fileType: file.Type['JSON'],
            contents: JSON.stringify(fileContent),
            folder: -15,
        }).save();

        let scriptTask = task.create({
            taskType: task.TaskType['MAP_REDUCE'],
            scriptId: 'customscript_mr_mass_email_tn_v2',
            deploymentId: 'customdeploy_mr_mass_email_tn_v2',
            params: {
                custscript_mr_mes_search_id: savedSearchId,
                custscript_mr_mes_exec_timestamp: fileContent.timestamp,
                custscript_mr_mes_param_file_id: fileId,
                custscript_mr_mes_entity_type: savedSearchType
            }
        });
        let scriptTaskId = scriptTask.submit();
        let status = task.checkStatus(scriptTaskId).status;

        _writeResponseJson(response, `Emails will be sent to all addresses present in the specified saved search. (${status})`);
    },
};


const sharedFunctions = {
    getEmailTemplate(emailTemplateId) {
        let {render} = NS_MODULES;
        let mergeResult = render.mergeEmail({
            templateId: emailTemplateId,
            entity: null,
            recipient: null,
            supportCaseId: null,
            transactionId: null,
            customRecord: null
        });
        let emailSubject = mergeResult.subject;
        let emailBody = mergeResult.body;

        return {emailSubject, emailBody};
    },
    getEmailAddressesFromSavedSearch(savedSearchId) {
        let {search} = NS_MODULES;
        let data = [];
        let fieldsToCheck = ['email', 'custentity_email_service', 'custentity_email_sales'];
        let chunk = 0;
        let chunkSize = 1000;
        let resultSubset = [];

        let emailAddressSearch = search.load({id: savedSearchId});

        let searchColumns = emailAddressSearch.columns.map(item => item.name);

        let fieldsToGet = _getArrayIntersection(fieldsToCheck, searchColumns);

        // Check if there's any intersection between searchColumns and fieldsToCheck. If there is none then this saved
        // search does not contain what we're looking for
        if (!fieldsToGet.length)
            return data;

        let resultSet = emailAddressSearch.run();

        do {
            resultSubset = resultSet.getRange({start: chunk * chunkSize, end: chunk * chunkSize + chunkSize});

            for (let result of resultSubset) {
                for (let field of fieldsToGet)
                    if (result.getValue(field)) data.push(result.getValue(field));
            }

            chunk++;
        } while (resultSubset.length >= chunkSize)

        return [...new Set(data)]; // we use 'new Set()' to eliminate duplicates
    }
};

function _parseIsoDatetime(dateString) {
    let dt = dateString.split(/[: T-]/).map(parseFloat);
    return new Date(dt[0], dt[1] - 1, dt[2], dt[3] || 0, dt[4] || 0, dt[5] || 0, 0);
}

function _parseISODate(dateString) {
    let dt = dateString.split(/[: T-]/).map(parseFloat);
    return new Date(dt[0], dt[1] - 1, dt[2]);
}

function _getLocalTimeFromOffset(localUTCOffset) {
    let today = new Date();
    let serverUTCOffset = today.getTimezoneOffset();

    let localTime = new Date();
    localTime.setTime(today.getTime() + (serverUTCOffset - parseInt(localUTCOffset)) * 60 * 1000);

    return localTime;
}

function _getArrayIntersection(a, b) {
    let setB = new Set(b);
    return [...new Set(a)].filter(x => setB.has(x));
}