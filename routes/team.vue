<template>
    <div>
        <h2>
            <Icon v="collective-logo.svg"/>
            <T>contact.team.name</T>
        </h2>

        <figure class="float-end border rounded">
            <img src="/img/collective-logo.svg" alt="" class="revesible"/>
            <figcaption>
                <p><T>contact.team.logo</T></p>
                <p class="text-center bigger mb-0">
                    <Icon v="transgender-alt"/>
                    +
                    <Icon v="comment"/>
                    =
                    <Icon v="collective-logo.svg"/>
                </p>
            </figcaption>
        </figure>

        <section>
            <T>contact.team.description</T>
        </section>

        <section>
            <h3>
                <Icon v="user-friends"/>
                <T>contact.team.members</T>
            </h3>

            <MemberList v-for="(members, locale) in membersByLocale" v-if="members.length" :key="locale" :locale="locale" :members="members"/>
        </section>
    </div>
</template>

<script>
    import { head } from "../src/helpers";

    export default {
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
    }
</script>

<style lang="scss" scoped>
    @import "assets/variables";

    img {
        max-width: 100%;
    }

    figure {
        width: 100%;
        max-width: 18rem;
        padding: $spacer;
        > img {
            width: 100%;
        }
        figcaption {
            font-size: $small-font-size;
        }
    }
    @include media-breakpoint-down('md', $grid-breakpoints) {
        figure {
            float: none !important;
            margin: 0 auto;
        }
    }

    .bigger {
        font-size: 2rem;
    }
</style>
