<template>
    <div style="display: inline-block;">
        <b-button class="mx-3" variant="success" @click="modal = true" :disabled="loading || form.busy">Send Mass Email</b-button>

        <b-modal centered v-model="modal" @hide="handleModalHide">
            <template v-slot:modal-header>
                <h6 class="text-center">Sending Mass Email</h6>
            </template>

            <b-row class="justify-content-center" v-if="loading || form.busy">
                <b-col cols="12" class="text-center">
                    <b-spinner variant="primary"></b-spinner>
                </b-col>
                <b-col cols="12" class="text-center">
                    Processing...
                </b-col>
            </b-row>
            <b-row class="justify-content-center" v-else>
                <b-col cols="12" class="text-center">
                    An email of the specified will be sent out to all email addresses found in the saved search. Proceed?
                </b-col>
            </b-row>

            <template v-slot:modal-footer>
                <b-button size="sm" variant="danger" @click="modal = false" :disabled="loading">No, cancel</b-button>
                <b-button size="sm" variant="success" @click="proceed" :disabled="loading || form.busy">Yes, let's send them!</b-button>
            </template>
        </b-modal>
    </div>
</template>

<script>
export default {
    name: "SendMassEmailButton",
    data: () => ({
        modal: false,
        loading: false,
    }),
    methods: {
        proceed() {
            this.$store.dispatch('sendMassEmails');
            this.modal = false;
        },
        handleModalHide(event) {
            if(this.loading) event.preventDefault();
        },
    },
    computed: {
        form() {
            return this.$store.getters['form']
        },
    }
}
</script>

<style scoped>

</style>