<template>
    <NotFound v-if="!content"/>
    <div v-else class="blog-post">
        <router-link :to="'/' + config.links.blogRoute" v-if="config.links.blog">
            <Icon v="pen-nib"/>
            <T>links.blog</T>
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
            return await blog.methods.fetchBlogPost('blog', route.params.slug);
        },
        head() {
            return head({
                title: this.title,
                banner: this.img,
            });
        },
    };
</script>
