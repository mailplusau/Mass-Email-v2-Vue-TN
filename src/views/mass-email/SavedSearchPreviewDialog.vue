<template>
    <v-dialog
        v-model="dialog" scrollable
        max-width="90vw"
    >
        <template v-slot:activator="{ on, attrs }">
            <v-btn block large outlined :disabled="disabled" color="primary" height="40px"
                v-bind="attrs" v-on="on"
            >
                preview
            </v-btn>
        </template>
        <v-card class="background">
            <v-card-title class="subtitle-1">{{ dialogTitle }}</v-card-title>

            <v-divider></v-divider>

            <v-card-text style="max-height: 70vh;">
                <v-row justify="center" class="mt-3" v-if="loading">
                    <v-col cols="auto">
                        <v-progress-circular indeterminate color="primary" size="30"
                        ></v-progress-circular>
                    </v-col>
                    <v-col cols="12">
                        <p class="subtitle-2 text-center">Retrieving saved search results...</p>
                        <p class="caption text-center red--text">Please note that this could take up to 30 minutes depending on the scope of the saved search.</p>
                    </v-col>
                </v-row>

                <v-row class="mt-2" v-else>
                    <v-col cols="12">
                        <v-data-table
                            class="elevation-4 background"
                            :headers="tableHeaders"
                            :items="data"
                            :items-per-page="5"
                        >
                        </v-data-table>
                    </v-col>
                </v-row>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions>
                <p class="caption ma-0 pa-0">Only up to 1000 first results are displayed here.<br>There could be more results in the selected saved search.</p>
                <v-spacer></v-spacer>
                <v-btn color="red darken-1" text
                    @click="dialog = false"
                >
                    Close
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    name: "SavedSearchPreviewDialog",
    computed: {
        disabled() {
            return !this.$store.getters['email-sender/form'].savedSearchId;
        },
        loading() {
            return !!this.$store.getters['email-sender/savedSearchPreview'].lastPromise;
        },
        tableHeaders() {
            return this.$store.getters['email-sender/savedSearchPreview'].tableHeaders;
        },
        data() {
            return this.$store.getters['email-sender/savedSearchPreview'].data;
        },
        dialogTitle() {
            return `Previewing saved search '${this.$store.getters['email-sender/savedSearchPreview'].savedSearchId}'
                of type [${this.$store.getters['email-sender/savedSearchPreview'].searchType}]`
        },
        dialog: {
            get() {
                return this.$store.getters['email-sender/savedSearchPreview'].open;
            },
            set(val) {
                if (val) this.$store.dispatch('email-sender/openSavedSearchPreviewDialog');
                else this.$store.dispatch('email-sender/closeSavedSearchPreviewDialog');
            }
        }
    }
};
</script>

<style scoped>

</style>