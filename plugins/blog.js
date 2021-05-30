export default {
    methods: {
        async fetchBlogPost(directory, slug) {
            try {
                const content = (await import(`../data/${directory}/${slug}.md`)).default
                    .replace(/<table>/g, '<div class="table-responsive"><table class="table table-striped small">')
                    .replace(/<\/table>/g, '</table></div>')
                    .replace(/<a href="http/g, '<a target="_blank" rel="noopener" href="http')
                ;
                const titleMatch = content.match('<h1[^>]*>([^<]+)</h1>');
                const title = titleMatch ? titleMatch[1] : null;
                const imgMatch = content.match('<img src="([^"]+)"[^>]*>');
                const img = imgMatch ? imgMatch[1] : null;

                return {
                    content,
                    title,
                    img,
                }
            } catch {
                return {
                    content: null,
                };
            }
        },
    }
}
