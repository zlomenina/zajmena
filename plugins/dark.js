export default {
    methods: {
        detectDark() {
            if (!process.client) {
                return false;
            }

            if (localStorage.getItem('darkMode') !== null) {
                return localStorage.getItem('darkMode') === 'dark';
            }

            const mediaMatch = window.matchMedia('(prefers-color-scheme: dark)');
            return mediaMatch.matches;
        },
        setMode(dark) {
            if (!process.client) {
                return;
            }

            if (dark) {
                document.body.setAttribute('data-theme', 'dark');
                localStorage.setItem('darkMode', 'dark');
            } else {
                document.body.removeAttribute('data-theme');
                localStorage.setItem('darkMode', 'light');
            }
        },
    }
}
