const fs = require('node:fs');
// Pages has no SPA rewrites. The fallback lets Expo Router handle deep links.
fs.copyFileSync('dist/index.html', 'dist/404.html');
fs.writeFileSync('dist/.nojekyll', '');
