<template>
    <div>
        <h4 class="mt-4" v-if="locale">
            <template v-if="locale === ''">
                <T>contact.team.upcoming</T>
            </template>
            <template v-else-if="locale === config.locale">
                {{locales[locale].name}}
            </template>
            <a v-else :href="locales[locale].url">
                {{locales[locale].name}}
            </a>
        </h4>
        <ul class="list-unstyled member-list">
            <li v-for="member in members" class="mb-3 d-flex">
                <a :href="`https://pronouns.page/@${member.username}`">
                    <Avatar :user="member" dsize="4rem"/>
                </a>
                <span class="ms-2">
                    {{ member.teamName }}
                    <br/>
                    <a :href="`https://pronouns.page/@${member.username}`" class="badge bg-light text-dark border">
                        @{{member.username}}
                    </a>
                </span>
            </li>
        </ul>
    </div>
</template>

<script>
    export default {
        props: {
            locale: { 'default': null },
            members: { required: true },
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
