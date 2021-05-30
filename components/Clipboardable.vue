<template>
    <span @click="clicked" class="clipboardable">
        <slot></slot>
        <span :class="['tooltip', text ? 'p-2' : 'p-1', show ? 'show' : '']">
            <Icon v="clipboard-check"/>
            <small v-if="text"><T>clipboard.success</T></small>
        </span>
    </span>
</template>

<script>
    export default {
        props: {
            message: { default: undefined },
            text: { type: Boolean },
        },
        data() {
            return {
                show: false,
            };
        },
        methods: {
            clicked() {
                if (!this.message) { return; }
                this.$copyText(this.message).then(() => {
                    this.show = true;
                    setTimeout(() => this.show = false, 2000)
                });
            }
        }
    }
</script>

<style lang="scss" scoped>
    @import "assets/variables";

    $margin: $spacer / 4;

    .clipboardable {
        position: relative;
        display: inline-block;

        .tooltip {
            position: absolute;
            top: $margin;
            left: $margin;
            height: calc(100% - #{2 * $margin});
            width: calc(100% - #{2 * $margin});
            overflow: hidden;
            text-align: center;

            display: none;
            opacity: 0;
            transition: opacity .3s ease-in-out;
            &.show {
                opacity: 1;
                display: block;
            }

            background-color: $tooltip-bg;
            color: $tooltip-color;
            border-radius: $border-radius;
        }
    }
</style>
