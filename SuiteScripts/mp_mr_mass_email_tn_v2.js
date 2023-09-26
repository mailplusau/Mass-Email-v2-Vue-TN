/**
 * @author Tim Nguyen
 * @description NetSuite Experimentation - Mass Email Sender.
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @created 30/06/2023
 */

import {VARS} from '@/utils/utils.mjs';

let NS_MODULES = {};

const thisScriptId = process.env.VUE_APP_NS_PROCESSOR_SCRIPT_ID; // The id of the record of this script in NetSuite
const moduleNames = ['render', 'file', 'runtime', 'search', 'record', 'url', 'format', 'email', 'task', 'log'];

const paramNames = {
    taskRecordId: `custscript_${thisScriptId}_task_record_id`
}

// eslint-disable-next-line no-undef
define(moduleNames.map(item => 'N/' + item), (...args) => {
    for (let [index, moduleName] of moduleNames.entries())
        NS_MODULES[moduleName] = args[index];


    function getInputData() {
        try {
            let taskRecordId = NS_MODULES.runtime['getCurrentScript']().getParameter(paramNames.taskRecordId);
            let taskRecord = NS_MODULES.record.load({type: 'customrecord_scheduled_task', id: taskRecordId});
            let taskParams = JSON.parse(taskRecord.getValue({fieldId: 'custrecord_task_parameters'}));
            let taskStatus = taskRecord.getValue({fieldId: 'custrecord_task_status'});
            let returnValues = [];

            if (taskStatus === VARS.TASK_STATUS.QUEUED) {
                taskRecord.setValue({fieldId: 'custrecord_task_status', value: VARS.TASK_STATUS.INDEXING});
                returnValues = _handleSavedSearchType(taskParams.savedSearchId, taskParams.savedSearchType);
            } else if (taskStatus === VARS.TASK_STATUS.INDEXING) {
                taskRecord.setValue({fieldId: 'custrecord_task_status', value: VARS.TASK_STATUS.SENDING});
                let taskData = _readTaskData(taskRecord);
                returnValues = taskData.emailAddresses;
            }
            taskRecord.save();

            return returnValues;
        } catch (e) { NS_MODULES.log.error({title: 'getInputData', details: `${e}`}); }
    }

    function reduce(context) {
        let taskRecordId = NS_MODULES.runtime['getCurrentScript']().getParameter(paramNames.taskRecordId);
        let taskRecord = NS_MODULES.record.load({type: 'customrecord_scheduled_task', id: taskRecordId});
        let taskStatus = taskRecord.getValue({fieldId: 'custrecord_task_status'});

        if (taskStatus === VARS.TASK_STATUS.INDEXING)
            _indexEmailAddresses(context, taskRecord);
        else if (taskStatus === VARS.TASK_STATUS.SENDING)
            _sendEmails(context, taskRecord);
    }

    function summarize(context) {
        let taskRecordId = NS_MODULES.runtime['getCurrentScript']().getParameter(paramNames.taskRecordId);
        let taskRecord = NS_MODULES.record.load({type: 'customrecord_scheduled_task', id: taskRecordId});
        let taskStatus = taskRecord.getValue({fieldId: 'custrecord_task_status'});

        _handleErrorsInSummary(context);
        
        if (taskStatus === VARS.TASK_STATUS.INDEXING)
            _summarizeIndexingPhase(context, taskRecordId, taskRecord);
        else if (taskStatus === VARS.TASK_STATUS.SENDING) // Finish sending. This is the end of the script.
            _summarizeSendingPhase(context, taskRecord);
    }

    return {
        getInputData,
        reduce,
        summarize
    };
});

function _handleSavedSearchType(savedSearchId, savedSearchType) {
    if (savedSearchType === 'Contact' || savedSearchType === 'Customer')
        return NS_MODULES.search.load({id: savedSearchId});
    else if (savedSearchType === 'Franchisee') {
        return NS_MODULES.search.create({
            type: 'customer',
            filters: [
                ['partner', 'is', savedSearchId],
                'AND',
                ['isinactive', 'is', false],
                'AND',
                ['entitystatus', 'is', 13] // Only signed customer receive the emails
            ],
            columns: ['internalid', 'email', 'custentity_email_service']
        })
    } else return [];
}

function _indexEmailAddresses(context) {
    let index = 0;
    let emailRegEx = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

    for (let value of context.values) {
        let searchResult = JSON.parse(value);
        let id = searchResult.values?.['customer.internalid'] ||
            searchResult.values?.internalid?.value || searchResult.values['internalid'] || null;

        if (!id) NS_MODULES.log.error({title: "Undefined ID", details: `${context.values}`});
        else
            for (let field in searchResult.values) { // check for any field that contains 'email' in its name and its value is a valid email address
                if (field.includes('email') && typeof searchResult.values[field] === 'string' && emailRegEx.test(searchResult.values[field]))
                    context.write({key: context.key + '|' + index, value: searchResult.values[field].toLowerCase() + '/' + id});

                index++;
            }
    }
}

function _sendEmails(context, taskRecord) {
    let taskParams = JSON.parse(taskRecord.getValue({fieldId: 'custrecord_task_parameters'}));

    if (Array.isArray(context.values) && context?.values?.length) {
        let index = 0;

        for (let value of context.values) {
            let [emailAddress, customerId] = value.split('/');
            let {authorId, customSubject, emailTemplateId} = taskParams;
            let {emailSubject, emailBody} = _getEmailTemplate(emailTemplateId, customerId);

            NS_MODULES.email.send({
                author: authorId,
                subject: customSubject || emailSubject,
                body: emailBody,
                recipients: emailAddress,
                relatedRecords: {
                    entityId: customerId
                }
            });

            taskParams.totalEmailSent++;
            taskRecord.setValue({fieldId: 'custrecord_task_parameters', value: JSON.stringify(taskParams)});
            taskRecord.save();

            NS_MODULES.log.debug({
                title: "_sendEmail",
                details: `Email sent to: ${emailAddress}. Remaining length: ${(taskParams.emailAddressIndexed - taskParams.totalEmailSent)}`,
            });

            context.write({key: context.key + '|' + index, value: `Message sent.`});

            index++;
        }
    } else NS_MODULES.log.debug({title: "reduce/sendMessage", details: `key: ${context.key} | values: ${JSON.stringify(context.values)}`});
}

function _getEmailTemplate(emailTemplateId, customerId) {
    let mergeResult = NS_MODULES.render.mergeEmail({
        templateId: emailTemplateId,
        entity: /^[0-9]+$/.test(customerId) ?
            {type: 'customer', id: parseInt(customerId)} :
            null,
    });
    let emailSubject = mergeResult.subject;
    let emailBody = mergeResult.body;

    return {emailSubject, emailBody};
}

function _summarizeIndexingPhase(context, taskRecordId, taskRecord) {
    let count = 0;
    let tempSet = new Set();
    let taskParams = JSON.parse(taskRecord.getValue({fieldId: 'custrecord_task_parameters'}));
    let taskData = _readTaskData(taskRecord);

    context.output.iterator().each((key, value) => {
        tempSet.add(value);
        count++;
        return true;
    });

    if (!taskData.emailAddresses) taskData.emailAddresses = [];
    taskData.emailAddresses = [...taskData.emailAddresses, ...tempSet];
    _writeTaskData(taskRecord, taskData);

    taskParams.emailAddressIndexed = tempSet.size; // total number of indexed email addresses
    taskRecord.setValue({fieldId: 'custrecord_task_parameters', value: JSON.stringify(taskParams)});

    // Run this script again
    let params = {};
    params[paramNames.taskRecordId] = taskRecordId;

    let scriptTask = NS_MODULES.task.create({
        taskType: taskRecord.getValue({fieldId: 'custrecord_task_type'}),
        scriptId: taskRecord.getValue({fieldId: 'custrecord_script_id'}),
        deploymentId: taskRecord.getValue({fieldId: 'custrecord_deployment_id'}),
        params
    });
    scriptTask.submit();

    NS_MODULES.log.debug({
        title: "summarize()",
        details: `Finished processing saved search id [${taskParams.savedSearchId}] of type [${taskParams.savedSearchType}]. 
                    ${count} entries processed. ${tempSet.size} unique email addresses found.`,
    });

    taskRecord.save();
}

function _summarizeSendingPhase(context, taskRecord) {
    taskRecord.setValue({fieldId: 'custrecord_task_status', value: VARS.TASK_STATUS.COMPLETED});

    let count = 0;
    context.output.iterator().each(() => {
        count++;
        return true;
    });

    NS_MODULES.log.debug({
        title: "summarize()",
        details: `Finished. ${count} emails were sent out.`,
    });

    // initiate the next job
    _launchNextTask(
        taskRecord.getValue({fieldId: 'custrecord_task_type'}),
        taskRecord.getValue({fieldId: 'custrecord_script_id'}),
        taskRecord.getValue({fieldId: 'custrecord_deployment_id'}));

    taskRecord.save();
}



function _handleErrorsInSummary(context) {
    let {log} = NS_MODULES;

    let errorCount = 0;

    if (context.inputSummary.error) {
        log.error('Error in Input', context.inputSummary.error);
        errorCount++;
    }

    context.reduceSummary.errors.iterator().each(function(key, error, executionNo) {
        log.error({
            title: 'Error in Reduce for key: ' + key + ', execution no. ' + executionNo,
            details: error
        });
        errorCount ++;
        return true;
    });

    return errorCount;
}

function _launchNextTask(taskType, scriptId, deploymentId) { // We launch the next task that is queued
    let taskRecordId = null;

    NS_MODULES.search.create({
        type: 'customrecord_scheduled_task',
        filters: [
            ['custrecord_task_type', 'is', taskType],
            'AND',
            ['custrecord_script_id', 'is', scriptId],
            'AND',
            ['custrecord_deployment_id', 'is', deploymentId],
            'AND',
            ['custrecord_task_status', 'is', VARS.TASK_STATUS.QUEUED],
        ],
        columns: [
            NS_MODULES.search.createColumn({name: "internalid"}),
            NS_MODULES.search.createColumn({name: "lastmodified", sort: "ASC"}),
        ]
    }).run().each(result => { taskRecordId = result.getValue('internalid'); });

    if (taskRecordId === null) return;

    try {
        let params = {};
        params[`custscript_${scriptId}_task_record_id`] = taskRecordId;

        let scriptTask = NS_MODULES.task.create({taskType, scriptId, deploymentId, params});
        scriptTask.submit();
    } catch (e) { NS_MODULES.debug.error({title: 'Error when launching next task', details: `${e}`}); }
}

function _readTaskData(taskRecord) {
    try {
        let availableFields = taskRecord['getFields']().filter(field => field.includes('custrecord_task_data_')).sort();
        let json = '';
        for (let fieldId of availableFields) json += taskRecord.getValue({fieldId});
        return JSON.parse(json);
    } catch (e) { return {}; }
}

function _writeTaskData(taskRecord, taskData) {
    let availableFields = taskRecord['getFields']().filter(field => field.includes('custrecord_task_data_')).sort();
    let dataArr = _splitStringByIndex(JSON.stringify(taskData), 999990); // limit of Long Text field is 1,000,000 characters, but we stop at 999,990

    for (let [index, fieldId] of availableFields.entries())
        taskRecord.setValue({fieldId, value: dataArr[index] || ''});

    if (dataArr.length > availableFields.length)
        NS_MODULES.log.error({
            title: 'Not enough [custrecord_task_data_xx] fields',
            details: `Data requires ${dataArr.length} fields however only ${availableFields.length} available.`
        })
}

function _splitStringByIndex(str, index) { // split json string into segments of ${index} in length
    if (!str) return [];

    return [str.substring(0, index), ..._splitStringByIndex(str.substring(index), index)]
}