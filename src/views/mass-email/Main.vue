<template>
    <div class="row">
        <div class="col-4 mb-4">
            <b-input-group prepend="Search Type">
                <b-form-select v-model="form.searchType" :options="$store.getters['searchTypes']" @change="$store.dispatch('handleSearchTypeChanged')"></b-form-select>
            </b-input-group>
        </div>
        <div class="col-8 mb-4">
            <b-input-group :prepend="form.searchType || 'No Search Type'">
                <SearchableSelect v-model="form.savedSearchId" :options="savedSearches" :max-height="'30vh'"
                                  v-validate="'required'" data-vv-name="saved_search" :disabled="form.busy || !form.searchType"
                                  :class="errors.has('saved_search') ? 'is-invalid' : ''"/>

                <b-form-invalid-feedback :state="!errors.has('saved_search')">{{ errors.first('saved_search') }}</b-form-invalid-feedback>
            </b-input-group>
        </div>

        <div class="col-12 mb-2">
            <b-input-group prepend="Email Template">
                <SearchableSelect v-model="form.emailTemplateId" :options="emailTemplates" :max-height="'30vh'"
                                  v-validate="'required'" data-vv-name="saved_search" :disabled="busy"
                                  :class="errors.has('email_template') ? 'is-invalid' : ''" @input="$store.dispatch('previewEmailTemplate')"/>

                <b-form-invalid-feedback :state="!errors.has('email_template')">{{ errors.first('email_template') }}</b-form-invalid-feedback>
            </b-input-group>
        </div>

        <PreviewEmailTemplate />

        <div class="col-12 mb-4" v-show="!!$store.getters['previewTemplateModal'].emailBody">
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
import PreviewEmailTemplate from "@/views/mass-email/PreviewEmailTemplate";
import http from "@/utils/http";

export default {
    name: "Main",
    components: {
        PreviewEmailTemplate,
        SendMassEmailButton, PreviewEmailAddressModal, PreviewEmailTemplateModal, SearchableSelect},
    data: () => ({
        type: '',
        types: [
            {value: 'customer', text: 'Customer'},
            {value: 'contact', text: 'Customer'},
            {value: 'customer', text: 'Customer'},
        ]
    }),
    methods: {
        testMethod() {
            http.post('testMethod').then(msg => console.log(msg));
        },
    },
    computed: {
        emailTemplates() {
            return this.$store.getters['emailTemplates'].map(item => ({
                value: item.custrecord_camp_comm_email_template,
                text: item.name
            }));
        },
        savedSearches() {
            return this.$store.getters['savedSearches'];
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