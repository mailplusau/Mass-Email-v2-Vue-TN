<template>
    <v-container fluid>
        <v-row>
            <v-col cols="4">
                <v-autocomplete
                    v-model="form.searchType"
                    :items="$store.getters['email-sender/searchTypes']" item-text="text" item-value="value"
                    label="Search Type"
                    outlined
                    @change="$store.dispatch('email-sender/handleSearchTypeChanged')"
                ></v-autocomplete>
            </v-col>

            <v-col cols="8">
                <v-autocomplete
                    v-model="form.savedSearchId"
                    :items="$store.getters['email-sender/savedSearches']" item-text="text" item-value="value"
                    :label="form.searchType || 'No Search Type Selected'"
                    outlined persistent-hint
                    :prepend-inner-icon="getIconForSearchType()"
                    append-outer-icon="mdi-refresh"
                    @click:append-outer="$store.dispatch('email-sender/handleSearchTypeChanged')"
                    :disabled="!form.searchType || form.busy"
                    :loading="form.busy"
                    :hint="form.emailCount || ''"
                    @change="$store.dispatch('email-sender/handleSavedSearchIdChanged')"
                ></v-autocomplete>
            </v-col>

            <v-col cols="12">
                <v-autocomplete
                    v-model="form.emailTemplateId"
                    :items="$store.getters['email-sender/emailTemplates']" item-text="name" item-value="custrecord_camp_comm_email_template"
                    :label="'Email Template'"
                    outlined persistent-hint
                    prepend-inner-icon="mdi-email"
                    append-outer-icon="mdi-refresh"
                    @click:append-outer="$store.dispatch('email-sender/getEmailTemplates')"
                    :disabled="form.busy"
                    :loading="form.busy"
                    :hint="`${$store.getters['email-sender/emailTemplates'].length} email templates available`"
                    @change="$store.dispatch('email-sender/handleEmailTemplateIdChanged')"
                ></v-autocomplete>
            </v-col>
        </v-row>

        <v-divider class="mt-3 mb-5"></v-divider>

        <EmailTemplatePreview />

        <v-row justify="space-around" align-content="center" align="center">
            <v-col cols="12">
                <SendMassEmailDialog />
            </v-col>
            <v-col cols="auto">
                <ScheduleMassEmailDialog class="mx-2" />
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import SendMassEmailDialog from '@/views/mass-email/SendMassEmailDialog';
import ScheduleMassEmailDialog from '@/views/mass-email/ScheduleMassEmailDialog';
import EmailTemplatePreview from '@/views/mass-email/EmailTemplatePreview';

export default {
    name: "Main",
    components: {EmailTemplatePreview, ScheduleMassEmailDialog, SendMassEmailDialog},
    methods: {
        getIconForSearchType() {
            let index = this.$store.getters['email-sender/searchTypes'].findIndex(item => item.value === this.form.searchType);
            return index >= 0 ? this.$store.getters['email-sender/searchTypes'][index].icon : 'mdi-book-account';
        },
    },
    computed: {
        form() {
            return this.$store.getters['email-sender/form'];
        },
    }
};
</script>

<style scoped>

</style>