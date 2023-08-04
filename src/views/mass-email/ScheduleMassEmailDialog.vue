<template>
    <v-dialog v-model="dialog" max-width="450px" persistent>
        <template v-slot:activator="{ on, attrs }">
            <v-btn :disabled="buttonDisabled" color="primary" outlined v-bind="attrs" v-on="on" small>
                Schedule this Mass Email
            </v-btn>
        </template>

        <v-card color="background">
            <v-toolbar dark color="primary">
                <v-toolbar-title>Schedule Mass Email</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-items>
                    <v-btn text @click="dialog = false" color="red">
                        Cancel
                    </v-btn>
                </v-toolbar-items>
            </v-toolbar>

            <v-container>
                <v-expand-transition mode="in-out">
                    <v-row key="row1" v-if="!confirm">
                        <v-col cols="12" class="mt-3">
                            <v-menu ref="dateMenu" v-model="dateMenu" :close-on-content-click="false"
                                    transition="scale-transition" offset-y max-width="290px" min-width="auto">

                                <template v-slot:activator="{ on, attrs }">
                                    <v-text-field ref="dateInput" v-model="enteredDate" label="Scheduled Date" hint="DD/MM/YYYY format"
                                                  persistent-hint prepend-icon="mdi-calendar" v-bind="attrs" v-on="on"
                                                  :rules="[validateEnteredDate]"
                                                  @blur="handleEnterOnDatePicker"
                                                  @keyup.enter="handleEnterOnDatePicker"
                                    ></v-text-field>
                                </template>

                                <v-date-picker
                                    v-model="selectedDate"
                                    no-title scrollable show-current
                                    @input="dateMenu = false"
                                ></v-date-picker>

                            </v-menu>
                        </v-col>

                        <v-col cols="12">
                            <v-menu ref="timeMenu" v-model="timeMenu" :close-on-content-click="false" :nudge-left="0"
                                    transition="scale-transition" offset-y max-width="290">

                                <template v-slot:activator="{ on, attrs }">
                                    <v-text-field ref="timeInput" v-model="enteredTime" label="Scheduled Time" hint="HH:MM format (24 hours)."
                                                  persistent-hint prepend-icon="mdi-clock-time-four-outline" v-bind="attrs" v-on="on"
                                                  :rules="[validateEnteredTime]"
                                                  @blur="handleEnteredTimeChanged"
                                                  @keyup.enter="handleEnteredTimeChanged"
                                    ></v-text-field>
                                </template>

                                <v-time-picker v-if="timeMenu" v-model="selectedTime" ampm-in-title format="24hr"
                                               scrollable no-title full-width @click:minute="timeMenu = false"
                                ></v-time-picker>

                            </v-menu>
                        </v-col>

                        <v-col cols="12">
                            <v-btn color="success" block elevation="5" @click="confirm = true" :disabled="proceedBtnDisabled">done</v-btn>
                        </v-col>
                    </v-row>
                    <v-row key="row2" v-else justify="space-between">
                        <v-col cols="12">
                            The Mass Email is scheduled to be sent on <b class="primary--text">{{enteredDate}}</b> at <b class="primary--text">{{enteredTime}}</b>.
                            Would you like to proceed?
                        </v-col>
                        <v-col class="shrink">
                            <v-btn @click="confirm = false" outlined>No, go back</v-btn>
                        </v-col>
                        <v-col class="shrink">
                            <v-btn color="success" @click="proceed">Yes, proceed</v-btn>
                        </v-col>
                    </v-row>
                </v-expand-transition>
            </v-container>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    name: "ScheduleMassEmailDialog",
    data: vm => ({
        dialog: false,
        selectedDate: (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().substring(0, 10),
        enteredDate: vm.formatDate((new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().substring(0, 10)),
        dateMenu: false,

        selectedTime: '01:00',
        enteredTime: '01:00',
        timeMenu: false,

        confirm: false,
    }),
    methods: {
        formatDate (date) {
            if (!date) return null

            const [year, month, day] = date.split('-')
            return `${day}/${month}/${year}`
        },
        parseEnteredDate () {
            if (typeof this.validateEnteredDate() === 'string') return null;

            const [day, month, year] = this.enteredDate.split('/');

            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        },
        validateEnteredDate() {
            const [day, month, year] = this.enteredDate.split('/');

            let dateObj = new Date(`${year}-${month}-${day}`);

            return !isNaN(dateObj.getTime()) || 'Invalid date format. Must be DD/MM/YYYY.';
        },
        handleEnterOnDatePicker(e) {
            if (typeof this.validateEnteredDate() === 'string') return;

            this.selectedDate = this.parseEnteredDate();

            if (e.type === 'blur') return;

            this.dateMenu = false;
            this.$refs.dateInput.blur();
        },
        validateEnteredTime() {
            let [strHour, strMinute] = this.enteredTime.split(':');
            let hour = parseInt(strHour);
            let minute = parseInt(strMinute);

            return (!isNaN(strHour) && !isNaN(strMinute) && hour >= 0 && minute >= 0 && hour <= 23 && minute <= 59) ||
                'Invalid time format. Must be HH:MM (24 hours).';
        },
        parseEnteredTime() {
            if (typeof this.validateEnteredTime() === 'string') return;

            let [hour, minute] = this.enteredTime.split(':');

            return `${String.prototype.padStart.call(parseInt(hour), 2, '0')}:${String.prototype.padStart.call(parseInt(minute), 2, '0')}`
        },
        handleEnteredTimeChanged(e) {
            if (typeof this.validateEnteredTime() === 'string') return;

            this.selectedTime = this.parseEnteredTime();

            if (e.type === 'blur') return;

            this.timeMenu = false;
            this.$refs.timeInput.blur();
        },
        proceed() {
            if (typeof this.validateEnteredTime() === 'string' || typeof this.validateEnteredDate() === 'string') return;

            this.dialog = false;
            this.$store.dispatch('email-sender/scheduleMassEmails', new Date(`${this.selectedDate}T${this.selectedTime}`));
            this.confirm = false;
        }
    },
    computed: {
        form() {
            return this.$store.getters['email-sender/form'];
        },
        buttonDisabled() {
            return !this.form.emailTemplateId || !this.form.savedSearchId || !this.form.customSubject;
        },
        proceedBtnDisabled() {
            return typeof this.validateEnteredTime() === 'string' || typeof this.validateEnteredDate() === 'string';
        }
    },
    watch: {
        selectedDate() {
            this.enteredDate = this.formatDate(this.selectedDate)
        },
        selectedTime() {
            this.enteredTime = this.selectedTime;
        },
        dialog(val) {
            if (val) this.confirm = false; // reset the confirmation page
        }
    }
};
</script>

<style scoped>

</style>