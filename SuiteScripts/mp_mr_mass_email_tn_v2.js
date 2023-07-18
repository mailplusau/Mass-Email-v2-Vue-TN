/**
 * @author Tim Nguyen
 * @description NetSuite Experimentation - Mass Email Sender.
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @created 30/06/2023
 */

let NS_MODULES = {};

const moduleNames = ['render', 'file', 'runtime', 'search', 'record', 'url', 'format', 'email', 'task', 'log'];

// eslint-disable-next-line no-undef
define(moduleNames.map(item => 'N/' + item), (...args) => {
    for (let [index, moduleName] of moduleNames.entries())
        NS_MODULES[moduleName] = args[index];


    function getInputData() {
        let {search, runtime, file, log} = NS_MODULES;
        let fileId = runtime.getCurrentScript().getParameter("custscript_mr_mes_param_file_id");
        let timestamp = runtime.getCurrentScript().getParameter("custscript_mr_mes_exec_timestamp");
        let entityType = runtime.getCurrentScript().getParameter("custscript_mr_mes_entity_type");
        let fileRecord = file.load({id: fileId});
        let fileContent = JSON.parse(fileRecord.getContents());

        // Check timestamp to make sure this file is intended for this task
        if (parseInt(timestamp) !== parseInt(fileContent.timestamp)) {
            log.debug({
                title: "getInputData()",
                details: `Timestamps mismatched. From params: ${timestamp}. From file: ${fileContent.timestamp}.`,
            });
            return [];
        }

        log.debug({
            title: "getInputData()",
            details: `Timestamp: ${timestamp}. entityType: ${entityType}.`,
        });

        if (entityType === 'Contact' || entityType === 'Customer')
            return search.load({id: runtime.getCurrentScript().getParameter("custscript_mr_mes_search_id")});
        else if (entityType === 'Franchisee') {
            return search.create({
                type: 'customer',
                filters: [
                    ['partner', 'is', runtime.getCurrentScript().getParameter("custscript_mr_mes_search_id")],
                    'AND',
                    ['isinactive', 'is', false],
                    'AND',
                    ['entitystatus', 'is', 13] // Only signed customer receive the emails
                ],
                columns: ['internalid', 'email', 'custentity_email_service']
            })
        } else return [];
    }

    // function map(context) {
    // }

    function reduce(context) {
        let index = 0;
        let fieldsToCheck = ['email', 'custentity_email_service', 'custentity_email_sales'];
        let searchResult = JSON.parse(context.values);

        for (let field of fieldsToCheck) {
            let id = searchResult.values?.['customer.internalid'] || searchResult.values?.internalid?.value || searchResult.values['internalid'];
            if (searchResult.values[field])
                context.write({
                    key: context.key + '|' + index,
                    value: searchResult.values[field] + '/' + id
                });

            index++;
        }
    }

    function summarize(context) {
        let {file, log, task, runtime} = NS_MODULES;
        let count = 0;

        let fileId = runtime.getCurrentScript().getParameter("custscript_mr_mes_param_file_id");
        let fileRecord = file.load({id: fileId});

        let fileContent = JSON.parse(fileRecord.getContents());
        let tempSet = new Set();

        context.output.iterator().each((key, value) => {
            tempSet.add(value);
            log.debug({
                title: "summarize()",
                details: `Entry #${count}. Value: ${value}`,
            });
            count++;
            return true;
        })

        if (tempSet.size) {
            fileContent.emails = [...tempSet];
            fileContent.totalEmailCount = tempSet.size;

            file.create({
                name: fileRecord.name,
                fileType: fileRecord.fileType,
                contents: JSON.stringify(fileContent),
                folder: fileRecord.folder,
            }).save();

            log.debug({
                title: "summarize()",
                details: `summarize() finished. ${count} entries processed. ${tempSet.size} unique email addresses found.`,
            });

            let scriptTask = task.create({
                taskType: task.TaskType['SCHEDULED_SCRIPT'],
                scriptId: 'customscript_sc_mass_email_tn_v2',
                deploymentId: 'customdeploy_sc_mass_email_tn_v2',
                params: {
                    custscript_execution_timestamp: fileContent.timestamp,
                    custscript_parameter_file_id: fileId,
                }
            });

            scriptTask.submit();
        } else
            log.debug({
                title: "summarize()",
                details: `Empty result. Task for sending emails was not created.`,
            });

    }

    return {
        getInputData,
        // map,
        reduce,
        summarize
    };
});