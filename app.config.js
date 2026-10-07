// Apply the repository subpath only to a GitHub Pages web build.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.GITHUB_PAGES === 'true' ? { baseUrl: '/Fahrtenbuch--App' } : {}),
  },
});
