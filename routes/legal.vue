<template>
    <div>
        <h2>
            <Icon v="collective-logo.svg"/>
            <T>contact.legal.name</T>
        </h2>

        <section>
            <T>contact.legal.description</T>
            <ul>
                <li v-for="(value, name) in $t('contact.legal.numbers')">
                    <strong>{{name}}:</strong> {{value}}
                </li>
            </ul>
        </section>

        <section>
            <h3><T>contact.legal.documents</T></h3>
            <ul>
                <li v-for="(title, slug) in config.contact.legal.documents">
                    <router-link :to="`/${config.contact.legal.route}/${slug}`">
                        {{title}}
                    </router-link>
                </li>
            </ul>
        </section>

        <section>
            <h3>
                <Icon v="user-friends"/>
                <T>contact.legal.board</T>
            </h3>

            <MemberList :members="Object.values(board)"/>
        </section>

        <section>
            <h3>
                <Icon v="user-friends"/>
                <T>contact.legal.auditorBoard</T>
            </h3>

            <MemberList :members="Object.values(auditorBoard)"/>
        </section>
    </div>
</template>

<script>
    import { head } from "../src/helpers";

    export default {
        data() {
            return {
                board: {},
                auditorBoard: {},
            }
        },
        head() {
            return head({
                title: this.$t('contact.team.name'),
            });
        },
        async asyncData({app}) {
            return {
                membersByLocale: await app.$axios.$get(`/admin/list`),
            }
        },
        mounted() {
            for (let localeMembers of Object.values(this.membersByLocale)) {
                for (let member of localeMembers) {
                    if (this.config.contact.legal.board.includes(member.username)) {
                        this.board[member.username] = member;
                    }
                    if (this.config.contact.legal.auditorBoard.includes(member.username)) {
                        this.auditorBoard[member.username] = member;
                    }
                }
            }
        }
    }
</script>

<style lang="scss" scoped>
    @import "assets/variables";

    @include media-breakpoint-up('md', $grid-breakpoints) {
        .member-list {
            column-count: 3;
            column-width: 16rem;
        }
    }
</style>
