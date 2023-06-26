<template>
    <div class="row">
        <div class="col-9 mb-4">
            <b-input-group prepend="Saved Search">
                <SearchableSelect v-model="form.savedSearchId" :options="savedSearches" :max-height="'30vh'"
                                  v-validate="'required'" data-vv-name="saved_search" :disabled="busy"
                                  :class="errors.has('saved_search') ? 'is-invalid' : ''"/>

                <b-form-invalid-feedback :state="!errors.has('saved_search')">{{ errors.first('saved_search') }}</b-form-invalid-feedback>
            </b-input-group>
        </div>

        <div class="col-3 mb-4">
            <b-button class="w-100" @click="$store.dispatch('previewEmailAddresses')">Retrieve Email Addresses</b-button>
        </div>

        <div class="col-9 mb-4">
            <b-input-group prepend="Email Template">
                <SearchableSelect v-model="form.emailTemplateId" :options="emailTemplates" :max-height="'30vh'"
                                  v-validate="'required'" data-vv-name="saved_search" :disabled="busy"
                                  :class="errors.has('email_template') ? 'is-invalid' : ''"/>

                <b-form-invalid-feedback :state="!errors.has('email_template')">{{ errors.first('email_template') }}</b-form-invalid-feedback>
            </b-input-group>
        </div>

        <div class="col-3 mb-4">
            <b-button class="w-100" @click="$store.dispatch('previewEmailTemplate')">Preview Email Template</b-button>
        </div>

        <div class="col-12 mb-4">
            <b-button class="mx-3" @click="$store.dispatch('sendTestEmail')">Send Myself Test Email</b-button>

            <SendMassEmailButton />
        </div>

        <PreviewEmailTemplateModal />

        <PreviewEmailAddressModal />

    </div>
</template>

<script>
import SearchableSelect from "@/components/SearchableSelect";
import PreviewEmailTemplateModal from "@/views/mass-email/PreviewEmailTemplateModal";
import PreviewEmailAddressModal from "@/views/mass-email/PreviewEmailAddressModal";
import SendMassEmailButton from "@/views/mass-email/SendMassEmailButton";

export default {
    name: "Main",
    components: {SendMassEmailButton, PreviewEmailAddressModal, PreviewEmailTemplateModal, SearchableSelect},
    computed: {
        emailTemplates() {
            return this.$store.getters['emailTemplates'].map(item => ({
                value: item.internalid,
                text: item.name
            }));
        },
        savedSearches() {
            return this.$store.getters['savedSearches'].map(item => ({
                value: item.id,
                text: item.title
            }));
        },
        form() {
            return this.$store.getters['form']
        },
        busy() {
            return false;
        },
    }
}
</script>

<style scoped>

</style>