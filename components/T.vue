<template>
    <component :is="Array.isArray(txt) ? 'div' : 'span'">
        <template v-if="Array.isArray(txt)">
            <p v-for="p in txt">
                <LinkedText :text="p"/>
            </p>
        </template>
        <LinkedText v-else :text="txt"/>
    </component>
</template>

<script>
    import t from '../src/translator';

    export default {
        props: {
            params: {},
            silent: {type: Boolean}
        },
        data() {
            return {
                txt: t(this.$slots.default[0].text, this.params || {}, !this.silent),
            }
        },
    }
</script>
