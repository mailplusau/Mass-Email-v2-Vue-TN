<template>
    <v-container fluid>
        <HistoryTable />

        <HistoryFilterButton />
    </v-container>
</template>

<script>
import HistoryFilterButton from '@/views/email-history/HistoryFilterButton';
import HistoryTable from '@/views/email-history/HistoryTable';

export default {
    name: "Main",
    components: {HistoryTable, HistoryFilterButton},
    computed: {
        historyData() {
            return this.$store.getters['email-history/data']
                .filter(item => this.$store.getters['email-history/filter'][item.custrecord_task_status])
        }
    }
};
</script>

<style scoped>

</style>