<template>
    <v-menu bottom left transition="slide-x-reverse-transition" offset-x dark :close-on-content-click="false"
            min-width="300px" nudge-left="20">
        <template v-slot:activator="{ on, attrs }">
            <v-fab-transition>
                <v-btn color="pink" dark fixed v-bind="attrs" v-on="on"
                       bottom right fab elevation="6">
                    <v-icon>mdi-filter</v-icon>
                </v-btn>
            </v-fab-transition>
        </template>

        <v-list dense>
            <v-list-item @click="$store.commit('email-history/showAllPending')">
                <v-list-item-title>
                    Show All Pending Messages
                </v-list-item-title>
            </v-list-item>
            <v-list-item @click="$store.commit('email-history/showAllInProgress')">
                <v-list-item-title>
                    Show All Messages In Progress
                </v-list-item-title>
            </v-list-item>
            <v-list-item @click="$store.commit('email-history/showAllCompleted')">
                <v-list-item-title>
                    Show All Sent Messages
                </v-list-item-title>
            </v-list-item>
            <v-list-item @click="$store.commit('email-history/showAllCancelled')">
                <v-list-item-title>
                    Show All Cancelled or Aborted
                </v-list-item-title>
            </v-list-item>

            <v-divider></v-divider>

            <v-list-item v-for="(status, index) in TASK_STATUS" :key="status" v-ripple>
                <v-list-item-title>
                    <v-checkbox :label="`${index}`" class="mt-0 pt-0"
                                v-model="$store.getters['email-history/filter'][status]"
                                dense hide-details></v-checkbox>
                </v-list-item-title>
            </v-list-item>

            <v-divider></v-divider>

            <v-list-item @click="$store.commit('email-history/deselectAllFilters')">
                <v-list-item-title>
                    Deselect All
                </v-list-item-title>
            </v-list-item>
            <v-list-item @click="$store.commit('email-history/selectAllFilters')">
                <v-list-item-title>
                    Select All
                </v-list-item-title>
            </v-list-item>
            <v-list-item @click="$store.commit('email-history/reverseAllFilters')">
                <v-list-item-title>
                    Revert Selection
                </v-list-item-title>
            </v-list-item>
        </v-list>
    </v-menu>
</template>

<script>
import {VARS} from '@/utils/utils.mjs';

export default {
    name: "HistoryFilterButton",
    data: () => ({
        ...VARS,
    }),
};
</script>

<style scoped>

</style>