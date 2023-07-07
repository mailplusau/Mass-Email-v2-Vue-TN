<template>
    <div class="col-12 mb-3">
        <hr>
        <h1>Email Template Preview</h1>
        <p v-if="loading" class="text-center">Retrieving email template...</p>
        <template v-else-if="emailBody">
            <b-input-group prepend="Email Subject" class="mb-3">
                <b-form-input v-model="form.customSubject"></b-form-input>
            </b-input-group>
            <iframe style="width: 100%;" :srcdoc="emailBody" ref="previewIframe" @load="onIframeLoaded"></iframe>
        </template>
        <p v-else class="text-center">No Template Selected</p>
    </div>
</template>

<script>
export default {
    name: "PreviewEmailTemplate",
    methods: {
        onIframeLoaded() {
            console.log(this.$refs);
            this.$refs.previewIframe.height = this.$refs.previewIframe.contentDocument.body.scrollHeight + 10 + 'px';
        }
    },
    computed: {
        emailBody() {
            return this.$store.getters['previewTemplateModal'].emailBody;
        },
        emailSubject() {
            return this.$store.getters['previewTemplateModal'].emailSubject;
        },
        loading() {
            return this.$store.getters['previewTemplateModal'].loading;
        },
        form() {
            return this.$store.getters['form']
        },
    }
}
</script>

<style scoped>

</style>