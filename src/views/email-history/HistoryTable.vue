<template>
    <v-row>
        <v-col cols="12">
            <v-data-table
                :headers="headers"
                :items="historyData"
                :items-per-page="20"
                class="elevation-5 background"
                :loading="$store.getters['email-history/loading']"
            >
                <template v-slot:top>
                    <v-toolbar flat dense color="primary" dark>
                        <v-toolbar-title>History Data</v-toolbar-title>
                        <v-divider class="mx-4" inset vertical></v-divider>

                        <v-spacer></v-spacer>

                        <v-btn color="secondary" outlined small @click="$store.dispatch('email-history/getAllTasks')"
                               v-if="!$store.getters['email-history/loading']">
                            <v-icon small>mdi-refresh</v-icon> refresh history
                        </v-btn>
                        <v-btn v-else disabled outlined small>
                            refreshing data...
                        </v-btn>
                    </v-toolbar>
                </template>

                <template v-slot:item.type="{ item }">
                    {{ getTaskParams(item).type }}
                </template>

                <template v-slot:item.recipient="{ item }">
                    {{ getTaskParams(item).recipient }}
                </template>

                <template v-slot:item.emailTemplate="{ item }">
                    {{ getTaskParams(item).emailTemplate }}
                </template>

                <template v-slot:item.custrecord_scheduled_time="{ item }">
                    {{ item.custrecord_scheduled_time || '[N/A]' }}
                </template>

                <template v-slot:item.custrecord_task_status="{ item }">
                    <v-chip :color="getTitleAndColor(item).color"
                        dark outlined small label>
                        {{ item.custrecord_task_status.toUpperCase() }}
                    </v-chip>
                </template>

                <template v-slot:item.action="{ item }">
                    <v-btn small text color="red" @click="idToCancel = item.internalid"
                           :disabled="![TASK_STATUS.QUEUED, TASK_STATUS.SCHEDULED].includes(item.custrecord_task_status)">
                        cancel
                    </v-btn>
                </template>
            </v-data-table>
        </v-col>

        <v-dialog v-model="cancelDialog" max-width="400">
            <v-card class="background">
                <v-card-title class="text-h5 red--text">
                    Abort this email?
                </v-card-title>

                <v-card-text>
                    Are you sure you want to abort this pending email?
                </v-card-text>

                <v-card-actions>
                    <v-btn color="red darken-1" text @click="cancelTask">
                        Yes, abort
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn text @click="cancelDialog = false">
                        No, don't abort
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-row>
</template>

<script>
import {VARS} from '@/utils/utils.mjs';

export default {
    name: "HistoryTable",
    data: () => ({
        ...VARS,
        headers: [
            { text: 'Search Type', value: 'type' },
            { text: 'Saved Search ID', value: 'recipient' },
            { text: 'Email Template', value: 'emailTemplate' },
            { text: 'Scheduled for', value: 'custrecord_scheduled_time', align: 'center' },
            { text: 'Last accessed', value: 'lastmodified', align: 'center' },
            { text: 'Status', value: 'custrecord_task_status', align: 'center'},
            { text: '', value: 'action', align: 'end' },
        ],
        idToCancel: null,
    }),
    methods: {
        getTitleAndColor(item) {
            let lookupTable = {};
            lookupTable[this.TASK_STATUS.QUEUED] = {
                title: 'for processing on ' + item.lastmodified,
                color: 'warning'
            };
            lookupTable[this.TASK_STATUS.SCHEDULED] = {
                title: 'for processing on ' + item.custrecord_scheduled_time,
                color: 'warning darken-1'
            };
            lookupTable[this.TASK_STATUS.STARTING] = {
                title: 'on ' + item.lastmodified,
                color: 'light-blue lighten-2'
            };
            lookupTable[this.TASK_STATUS.INDEXING] = {
                title: 'phase started on ' + item.lastmodified,
                color: 'light-blue'
            };
            lookupTable[this.TASK_STATUS.SENDING] = {
                title: 'phase started on ' + item.lastmodified,
                color: 'light-blue darken-3'
            };
            lookupTable[this.TASK_STATUS.ERROR] = {
                title: 'Last accessed: ' + item.lastmodified,
                color: 'red'
            };
            lookupTable[this.TASK_STATUS.COMPLETED] = {
                title: 'on ' + item.lastmodified,
                color: 'success'
            };
            lookupTable[this.TASK_STATUS.CANCELLED] = {
                title: 'on ' + item.lastmodified,
                color: 'black'
            };
            return lookupTable[item.custrecord_task_status] || {};
        },
        getTaskParams(item) {
            let type = '';
            let recipient = '';
            let emailTemplate = '';

            try {
                let data = JSON.parse(item.custrecord_task_parameters);
                type = data.savedSearchType;
                recipient = data.savedSearchId;
                let index = this.$store.getters['email-sender/emailTemplates']
                    .findIndex(item => parseInt(item['custrecord_camp_comm_email_template']) === parseInt(data.emailTemplateId));
                emailTemplate = this.$store.getters['email-sender/emailTemplates'][index]?.name || '[N/A]';
            } catch (e) { console.error(e); }

            return {type, recipient, emailTemplate};
        },
        cancelTask() {
            this.$store.dispatch('email-history/cancelTask', this.idToCancel);
            this.cancelDialog = false;
        },
    },
    computed: {
        historyData() {
            return this.$store.getters['email-history/data']
                .filter(item => this.$store.getters['email-history/filter'][item.custrecord_task_status])
        },
        cancelDialog: {
            get() {
                return this.idToCancel !== null;
            },
            set(val) {
                if (!val) this.idToCancel = null;
            },
        }
    }
};
</script>

<style scoped>

</style>