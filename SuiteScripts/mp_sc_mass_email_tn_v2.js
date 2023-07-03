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
        let {timestamp, emails, customSubject, emailTemplateId, authorId} = JSON.parse(fileRecord.getContents());
        let [emailAddress, customerId] = emails?.length ? emails.pop().split('/') : [];

        if (!timestamp || !email?.length || !emailTemplateId || !authorId) {
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


        log.debug({
            title: "execute()",
            details: `Sending email to: ${emailAddress}. Remaining length: ${emails?.length}`,
        });

        let {emailSubject, emailBody} = _getEmailTemplate(emailTemplateId);
        email.send({
            author: authorId,
            subject: customSubject || emailSubject,
            body: emailBody,
            recipients: emailAddress,
            relatedRecords: {
                entityId: customerId
            }
        })

        if (emails?.length) {
            file.create({
                name: fileRecord.name,
                fileType: fileRecord.fileType,
                contents: JSON.stringify({timestamp, emails, customSubject, emailTemplateId, authorId}),
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
        } else
            log.debug({
                title: "execute()",
                details: `Finished execution`,
            });
    }

    function _getEmailTemplate(emailTemplateId) {
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
    }

    return { execute };
});