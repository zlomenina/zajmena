<template>
    <span @click="clicked" class="clipboardable">
        <slot></slot>
        <span :class="['tooltip', message && message.includes('0763') ? 'show' : '']">
            <span class="tooltip-arrow"></span>
            <span class="tooltip-inner">
                <T>clipboard.success</T>
            </span>
        </span>
    </span>
</template>

<script>
    export default {
        props: {
            message: { default: undefined },
        },
        methods: {
            clicked() {
                if (!this.message) { return; }
                this.$copyText(this.message).then(e => console.log(e));
            }
        }
    }
</script>

<style lang="scss" scoped>
    @import "assets/variables";

    .clipboardable {
        position: relative;
        .tooltip {
            position: absolute;
            top: calc(100% + 0.5rem);
            left: 0;

            position: absolute;
            z-index: $zindex-tooltip;
            display: block;
            margin: $tooltip-margin;
            // Our parent element can be arbitrary since tooltips are by default inserted as a sibling of their target element.
            // So reset our font and text properties to avoid inheriting weird values.
            @include reset-text();
            @include font-size($tooltip-font-size);
            // Allow breaking very long words so they don't overflow the tooltip's bounds
            word-wrap: break-word;
            opacity: 0;

            &.show { opacity: $tooltip-opacity; }

            .tooltip-arrow {
                position: absolute;
                display: block;
                width: $tooltip-arrow-width;
                height: $tooltip-arrow-height;

                &::before {
                    position: absolute;
                    content: "";
                    border-color: transparent;
                    border-style: solid;
                }
            }

            padding: $tooltip-arrow-height 0;

            .tooltip-arrow {
                top: 0;

                &::before {
                    bottom: -1px;
                    border-width: 0 ($tooltip-arrow-width / 2) $tooltip-arrow-height;
                    border-bottom-color: $tooltip-arrow-color;
                }
            }

            .tooltip-inner {
                max-width: $tooltip-max-width;
                padding: $tooltip-padding-y $tooltip-padding-x;
                color: $tooltip-color;
                text-align: center;
                background-color: $tooltip-bg;
                @include border-radius($tooltip-border-radius);
            }
        }
    }
</style>
