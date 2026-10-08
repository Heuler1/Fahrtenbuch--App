// Apply the repository subpath only to a GitHub Pages web build.
module.exports = ({ config }) => ({
  ...config,
  ...(process.env.ANDROID_PREVIEW === 'true' ? {
    name: 'Fahrtenbuch Test',
    android: { ...config.android, package: 'at.grobner.oldtimerfahrtenbuch.preview' },
  } : {}),
  experiments: {
    ...config.experiments,
    ...(process.env.GITHUB_PAGES === 'true' ? { baseUrl: '/Fahrtenbuch--App' } : {}),
  },
});
