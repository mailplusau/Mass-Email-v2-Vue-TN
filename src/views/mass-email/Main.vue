<template>
    <div class="row">
        <div class="col-4 mb-2">
            <b-input-group prepend="Search Type">
                <b-form-select v-model="form.searchType" :options="$store.getters['searchTypes']"
                               @change="$store.dispatch('handleSearchTypeChanged')"
                               :disabled="form.busy"></b-form-select>
            </b-input-group>
        </div>
        <div class="col-8 mb-2">
            <b-input-group :prepend="form.searchType || 'No Search Type'">
                <SearchableSelect v-model="form.savedSearchId" :options="savedSearches" :max-height="'60vh'"
                                  :disabled="form.busy || !form.searchType" @input="$store.dispatch('handleSavedSearchIdChanged')"/>

                <div class="d-block w-100 mt-1">{{form.emailCount || ''}}</div>
            </b-input-group>
        </div>

        <div class="col-12 mb-2">
            <b-input-group prepend="Email Template">
                <SearchableSelect v-model="form.emailTemplateId" :options="emailTemplates" :max-height="'30vh'"
                                  :disabled="busy" :class="errors.has('email_template') ? 'is-invalid' : ''"
                                  @input="$store.dispatch('previewEmailTemplate')"/>
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

export default {
    name: "Main",
    components: {
        PreviewEmailTemplate,
        SendMassEmailButton, PreviewEmailAddressModal, PreviewEmailTemplateModal, SearchableSelect},
    methods: {

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