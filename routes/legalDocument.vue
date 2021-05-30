<template>
    <NotFound v-if="!content"/>
    <div v-else class="blog-post">
        <router-link :to="'/' + config.contact.legal.route">
            <Icon v="collective-logo.svg"/>
            <T>contact.legal.name</T>
        </router-link>

        <BlogPost :content="content"/>

        <Separator icon="heart"/>

        <Support/>

        <section>
            <Share :title="title"/>
        </section>
    </div>
</template>

<script>
    import { head } from "../src/helpers";
    import blog from "../plugins/blog";

    export default {
        async asyncData({route}) {
            console.log(route);
            return await blog.methods.fetchBlogPost('legal', route.params.slug);
        },
        head() {
            return head({
                title: this.title,
                banner: this.img,
            });
        },
    };
</script>
