<template>
    <a :href="link" target="_blank" rel="noopener" class="btn-square m-1" :style="colour ? ('background-color: ' + colour) : 'colour'">
        <slot></slot>
    </a>
</template>

<script>
    export default {
        props: {
            link: { required: true },
            colour: { },
        },
    }
</script>

<style lang="scss" scoped>
    @import "assets/variables";
    $size: 2.2rem;

    .btn-square {
        display: inline-block;
        height: $size;
        min-width: $size;
        text-align: center;

        background-color: $primary;
        border-radius: $border-radius;
        border: none;
        color: white;
        line-height: 1.5;
        font-size: $size * 0.6;
        transition: opacity 300ms ease;

        &:hover {
            border: none;
            cursor: pointer;
            opacity: .7;
            color: white;
            text-decoration: none;
        }

        img {
            width: 1em;
        }

        .fa-fw {
            position: relative;
            top: .2em;
        }
    }
</style>
