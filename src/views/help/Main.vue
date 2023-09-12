<template>
    <v-container fluid>
        <v-row>
            <v-col>
                <p>Help section for Mass Email Sender</p>
                <p>This module is used to send a specified email template to one of the following 3 recipient targets:</p>
                <ul class="mb-4">
                    <li>
                        <b>A Saved Search for Customers:</b> A valid saved search for Customers needs to have the
                        customer's internal id field and at least 1 email field in Results tab.
                    </li>
                    <li>
                        <b>A Saved Search for Contacts:</b> A valid saved search for Contacts needs to have the customer's
                        internal id field and at least 1 email field in Results tab.
                    </li>
                    <li>
                        <b>Customers associated to a Franchisee:</b> There are no requirement for this target. The user
                        only needs to select a franchisee and the number of associated customers will be shown.
                    </li>
                </ul>
                <p>If you have any question or suggestion, please contact <b>{{AUTHOR_NAME}}</b> ({{AUTHOR_EMAIL}}).</p>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
import {VARS} from "@/utils/utils";

export default {
    name: "Main",
    data: () => ({
        ...VARS,
    }),
};
</script>

<style scoped>

</style>