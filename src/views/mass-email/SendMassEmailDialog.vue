<template>
    <v-dialog v-model="dialog" max-width="400">
        <template v-slot:activator="{ on, attrs }">
            <v-btn :disabled="buttonDisabled" color="success" large block
                   v-bind="attrs" v-on="on">
                Send out emails
            </v-btn>
        </template>

        <v-card class="background">
            <v-card-title class="text-h5">
                Send Mass Email?
            </v-card-title>

            <v-card-text>
                An email will be sent to all email addresses present in the selected saved search. It might take some times for this process to finish.
            </v-card-text>
            <v-card-text>
                Would you like to proceed?
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="red darken-1" text @click="dialog = false">
                    Cancel
                </v-btn>
                <v-btn color="green darken-1" text @click="proceed">
                    Yes, send it
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    name: "SendMassEmailDialog",
    data: () => ({
        dialog: false,
    }),
    methods: {
        proceed() {
            this.dialog = false;
            this.$store.dispatch('email-sender/sendMassEmails');
        }
    },
    computed: {
        form() {
            return this.$store.getters['email-sender/form'];
        },
        buttonDisabled() {
            return !this.form.emailTemplateId || !this.form.savedSearchId || !this.form.customSubject;
        }
    }
};
</script>

<style scoped>

</style>