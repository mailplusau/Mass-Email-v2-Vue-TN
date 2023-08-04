<template>
    <v-row>
        <v-col cols="12" class="text-center">
            <p class="text-h4 ma-0">Email Template Preview</p>
        </v-col>
        <v-col cols="12" class="text-center">
            <p class="text-h5 primary--text" v-if="emailTemplatePreview.loading">Retrieving email template...</p>
            <p class="text-h5 grey--text" v-else-if="!emailTemplatePreview.emailBody">No preview available</p>
        </v-col>

        <template v-if="emailTemplatePreview.emailBody">
            <v-col cols="12">
                <v-text-field label="Custom Subject" v-model="form.customSubject"
                              hide-spin-buttons outlined
                              autocomplete="off"
                              placeholder="Enter a custom subject for this email."></v-text-field>
            </v-col>
            <v-col cols="12">
                <iframe style="width: 100%;" :srcdoc="emailTemplatePreview.emailBody" ref="previewIframe" @load="onIframeLoaded"></iframe>
            </v-col>
        </template>
    </v-row>
</template>

<script>
export default {
    name: "EmailTemplatePreview",
    methods: {
        onIframeLoaded() {
            this.$refs.previewIframe.height = this.$refs.previewIframe.contentDocument.body.scrollHeight + 50 + 'px';
        }
    },
    computed: {
        emailTemplatePreview() {
            return this.$store.getters['email-sender/emailTemplatePreview'];
        },
        form() {
            return this.$store.getters['email-sender/form'];
        },
    }
};
</script>

<style scoped>

</style>