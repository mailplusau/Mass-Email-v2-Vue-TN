<template>
    <b-modal size="lg" centered v-model="modalOpen" hide-footer @hide="handleModalHide">
        <template v-slot:modal-header>
            <h5 class="text-center">Saved Search ID: {{savedSearchId}}</h5>
            <b-button size="sm" @click="modalOpen = false" :disabled="loading">Close</b-button>
        </template>

        <p v-if="loading">Searching For Email Addresses (this might take a couple minutes)...</p>
        <div v-else-if="emailAddresses.length">{{emailAddresses}}</div>
        <p v-else>No Email Address Found In This Saved Search</p>
    </b-modal>
</template>

<script>
export default {
    name: "PreviewEmailAddressModal",
    methods: {
        handleModalHide(event) {
            if(this.loading) event.preventDefault();
        },
    },
    computed: {
        modalOpen: {
            get() {
                return this.$store.getters['previewEmailAddressModal'].open;
            },
            set(val) {
                this.$store.getters['previewEmailAddressModal'].open = val;
            }
        },
        emailAddresses() {
            return this.$store.getters['previewEmailAddressModal'].emailAddresses;
        },
        loading() {
            return this.$store.getters['previewEmailAddressModal'].loading;
        },
        savedSearchId() {
            return this.$store.getters['previewEmailAddressModal'].selectedId;
        }
    }
}
</script>

<style scoped>

</style>