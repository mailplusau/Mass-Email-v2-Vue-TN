/**
 * @author Tim Nguyen
 * @description NetSuite Experimentation - Mass Email Sender with Vue 2
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @created 13/04/2023
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
        let columnNames = ['internalid', 'name', 'subject'];

        search.create({
            type: search.Type['EMAIL_TEMPLATE'],
            filters: [],
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
                // {name: 'recordtype', operator: 'is', values: 'Customer'},
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
    'getEmailAddressesFromSavedSearch' : function (response, {savedSearchId}) {
        _writeResponseJson(response, sharedFunctions.getEmailAddressesFromSavedSearch(savedSearchId));
    },
    'getEmailTemplate' : function (response, {emailTemplateId}) {
        _writeResponseJson(response, sharedFunctions.getEmailTemplate(emailTemplateId));
    }
}

const postOperations = {
    'sendTestEmail' : function (response, {emailTemplateId}) {
        let {runtime, email} = NS_MODULES;
        let {emailSubject, emailBody} = sharedFunctions.getEmailTemplate(emailTemplateId);

        email.sendBulk({
            author: 112209,
            recipients: [runtime.getCurrentUser().email],
            subject: emailSubject,
            body: emailBody,
            isInternalOnly: true
        });

        _writeResponseJson(response, {recipient: runtime.getCurrentUser().email});
    },
    'sendMassEmails' : function (response, {savedSearchId, emailTemplateId}) {
        let {email} = NS_MODULES;
        let emailAddresses = sharedFunctions.getEmailAddressesFromSavedSearch(savedSearchId);
        let {emailSubject, emailBody} = sharedFunctions.getEmailTemplate(emailTemplateId);

        if (emailAddresses.length) {
            email.sendBulk({
                author: 112209, // sending as system@sent-via.netsuite.com
                body: emailBody,
                subject: emailSubject,
                recipients: emailAddresses,
                isInternalOnly: false
            });

            _writeResponseJson(response, 'Emails have been sent to all addresses present in the specified saved search.');
        } else _writeResponseJson(response, 'No email was sent. Saved search contain no email address.');
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
        let fieldsToGet = [];
        let fieldsToCheck = ['email', 'custentity_email_service', 'custentity_email_sales'];
        let fieldsAreChecked = false;
        let chunk = 0;
        let resultSubset = [];

        let resultSet = search.load({id: savedSearchId}).run();

        do {
            resultSubset = resultSet.getRange({start: chunk * 1000, end: chunk * 1000 + 1000});

            for (let result of resultSubset) {
                if (!fieldsAreChecked) {
                    for (let column of result.columns)
                        if (fieldsToCheck.includes(column.name)) fieldsToGet.push(column.name);

                    fieldsAreChecked = true;
                }

                if (!fieldsToGet.length) break;

                for (let field of fieldsToGet)
                    if (result.getValue(field)) data.push(result.getValue(field));

                chunk++;
            }

            if (!fieldsToGet.length) break;
        } while(resultSubset.length >= 1000 && fieldsToGet.length)

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