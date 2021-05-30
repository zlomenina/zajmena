<template>
    <div v-if="content" v-html="content"></div>
</template>

<script>
    export default {
        props: {
            content: { required: true },
        }
    }
</script>

<style lang="scss" scoped>
    @import "assets/variables";

    img {
        max-width: 100%;
    }

    figure {
        width: 100%;
        max-width: 24rem;
        padding: $spacer;
        img {
            width: 100%;
        }
        figcaption {
            margin-top: $spacer / 2;
            font-size: $small-font-size;
        }
    }

    .forms-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(18rem, 3fr));
        grid-gap: $spacer;
        justify-items: center;
        figure {
            padding: 0;
            figcaption {
                font-size: 90%;
            }
        }
    }
</style>
