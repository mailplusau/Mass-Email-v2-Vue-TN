<template>
    <b-modal size="lg" centered v-model="modalOpen" hide-footer @hide="handleModalHide">
        <template v-slot:modal-header>
            <h5 class="text-center">Subject: {{emailSubject}}</h5>
            <b-button size="sm" @click="modalOpen = false" :disabled="loading">Close</b-button>
        </template>

        <p v-if="loading">Retrieving email template...</p>
        <iframe v-else-if="emailBody" style="width: 100%; height: 80vh;" :srcdoc="emailBody"></iframe>
        <p v-else>Template Not Found</p>
    </b-modal>
</template>

<script>
export default {
    name: "PreviewEmailTemplateModal",
    methods: {
        handleModalHide(event) {
            if(this.loading) event.preventDefault();
        },
    },
    computed: {
        modalOpen: {
            get() {
                return this.$store.getters['previewTemplateModal'].open;
            },
            set(val) {
                this.$store.getters['previewTemplateModal'].open = val;
            }
        },
        emailBody() {
            return this.$store.getters['previewTemplateModal'].emailBody;
        },
        emailSubject() {
            return this.$store.getters['previewTemplateModal'].emailSubject;
        },
        loading() {
            return this.$store.getters['previewTemplateModal'].loading;
        }
    }
}
</script>

<style scoped>

</style>