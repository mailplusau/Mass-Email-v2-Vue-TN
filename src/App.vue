<template>
    <v-app :style="{background: $vuetify.theme.themes[theme].background}">
        <v-main>
            <v-container fluid>
                <v-row class="mx-1" justify="space-between" align="center">
                    <v-col cols="auto">
                        <h1 class="primary--text">
                            Mass Email Sender
                        </h1>
                    </v-col>

                    <v-col cols="auto">
                        <a @click="$store.dispatch('addShortcut')" class="subtitle-1">Add To Shortcuts <v-icon size="20" color="primary">mdi-open-in-new</v-icon></a>
                    </v-col>
                </v-row>
            </v-container>

            <v-tabs v-model="mainTab" color="primary" background-color="background">
                <v-tab :href="`#${mainTabNames.HOME}`">
                    <v-icon left>
                        mdi-home
                    </v-icon>
                    Home
                </v-tab>
                <v-tab :href="`#${mainTabNames.HISTORY}`">
                    <v-icon left>
                        mdi-history
                    </v-icon>
                    History
                </v-tab>
                <v-spacer></v-spacer>

                <v-tab :href="`#${mainTabNames.HELP}`">
                    <v-icon left>
                        mdi-help-circle-outline
                    </v-icon>
                    Help
                </v-tab>
            </v-tabs>

            <v-divider></v-divider>

            <v-tabs-items v-model="mainTab" class="background">
                <v-tab-item :value="mainTabNames.HOME">
                    <MassEmailSender />
                </v-tab-item>
                <v-tab-item :value="mainTabNames.HISTORY">
                    <EmailHistory />
                </v-tab-item>
                <v-tab-item :value="mainTabNames.HELP">
                    <HelpPage />
                </v-tab-item>
            </v-tabs-items>
        </v-main>

        <GlobalNotificationModal />


        <v-fab-transition>
            <v-btn fab dark fixed bottom right
                v-scroll="onScroll"
                v-show="fab"
                color="primary"
                @click="toTop"
            >
                <v-icon>mdi-chevron-up</v-icon>
            </v-btn>
        </v-fab-transition>
    </v-app>
</template>

<script>
import EmailHistory from "@/views/email-history/Main";
import MassEmailSender from "@/views/mass-email/Main";
import HelpPage from "@/views/help/Main";
import GlobalNotificationModal from "@/components/GlobalNotificationModal";
import {VARS} from "@/utils/utils";

export default {
    name: 'App',
    data: () => ({
        ...VARS,
        fab: false,
    }),
    components: {
        GlobalNotificationModal,
        EmailHistory,
        MassEmailSender,
        HelpPage,
    },
    created() {
        this.$store.dispatch('init');
    },
    methods: {
        onScroll (e) {
            if (typeof window === 'undefined') return;
            const top = window.scrollY || e.target.scrollTop || 0;
            this.fab = top > 20
        },
        toTop () {
            this.$vuetify.goTo(0)
        }
    },
    computed:{
        theme(){
            return (this.$vuetify.theme.dark) ? 'dark' : 'light';
        },
        mainTab: {
            get() {
                return this.$store.getters['mainTab'];
            },
            set(val) {
                this.$store.commit('setMainTab', val);
            }
        }
    }
};
</script>

<style>
.cell-text-size {
    font-size: 11px !important;
}
</style>