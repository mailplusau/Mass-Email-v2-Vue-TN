// noinspection JSVoidFunctionReturnValueUsed

/**
 * @author Tim Nguyen
 * @description NetSuite Experimentation - Mass Email Sender.
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @created 21/06/2023
 */

let NS_MODULES = {};

const moduleNames = ['render', 'file', 'runtime', 'search', 'record', 'url', 'format', 'email', 'task', 'log'];

// eslint-disable-next-line no-undef
define(moduleNames.map(item => 'N/' + item), (...args) => {
    for (let [index, moduleName] of moduleNames.entries())
        NS_MODULES[moduleName] = args[index];

    function execute(context) {
        if (context.type !== context.InvocationType.ON_DEMAND) return;

        let {log, file, runtime, task, email} = NS_MODULES;
        let fileId = runtime.getCurrentScript().getParameter("custscript_parameter_file_id");
        let paramTimestamp = runtime.getCurrentScript().getParameter("custscript_execution_timestamp");
        let fileRecord = file.load({id: fileId});
        let {timestamp, emails, totalEmailCount, customSubject, emailTemplateId, authorId} = JSON.parse(fileRecord.getContents());

        if (!timestamp || !emails || !emailTemplateId || !authorId) {
            log.debug({
                title: "execute()",
                details: `Parameters missing from file. Timestamp: ${timestamp}. Emails: ${emails?.length}. Email Template ID: ${emailTemplateId}. Author ID: ${authorId}. Custom Subject: ${customSubject}.`,
            });
            return;
        }

        if (parseInt(paramTimestamp) !== parseInt(timestamp)) {
            log.debug({
                title: "execute()",
                details: `Timestamps mismatched. From params: ${paramTimestamp}. From file: ${timestamp}.`,
            });
            return;
        }

        if (emails?.length) {
            // TODO: clean up the file (maybe?)
            let [emailAddress, customerId] = emails?.length ? emails.pop().split('/') : [];
            let {emailSubject, emailBody} = _getEmailTemplate(emailTemplateId, customerId);
            email.send({
                author: authorId,
                subject: customSubject || emailSubject,
                body: emailBody,
                recipients: emailAddress,
                relatedRecords: {
                    entityId: customerId
                }
            })
            log.debug({
                title: "execute()",
                details: `Email sent to: ${emailAddress}. Remaining length: ${emails?.length}`,
            });

            file.create({
                name: fileRecord.name,
                fileType: fileRecord.fileType,
                contents: JSON.stringify({status: 'SENDING', timestamp, emails, totalEmailCount, customSubject, emailTemplateId, authorId}),
                folder: fileRecord.folder,
            }).save();

            let scriptTask = task.create({
                taskType: task.TaskType['SCHEDULED_SCRIPT'],
                scriptId: 'customscript_sc_mass_email_tn_v2',
                deploymentId: 'customdeploy_sc_mass_email_tn_v2',
                params: {
                    custscript_execution_timestamp: timestamp,
                    custscript_parameter_file_id: fileId,
                }
            });

            scriptTask.submit();
        } else {
            file.create({
                name: fileRecord.name,
                fileType: fileRecord.fileType,
                contents: JSON.stringify({status: 'COMPLETED',timestamp, emails, customSubject, emailTemplateId, authorId}),
                folder: fileRecord.folder,
            }).save();

            log.debug({title: "execute()", details: `Execution finished.`});
        }


    }

    function _getEmailTemplate(emailTemplateId, customerId) {
        let {render} = NS_MODULES;
        let mergeResult = render.mergeEmail({
            templateId: emailTemplateId,
            entity: customerId ? {
                type: 'customer',
                id: parseInt(customerId)
            } : null,
        });
        let emailSubject = mergeResult.subject;
        let emailBody = mergeResult.body;

        return {emailSubject, emailBody};
    }

    return { execute };
});