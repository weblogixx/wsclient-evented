module.exports = (api) => {
  // Configure file caching
  api.cache(true);

  return {
    presets: [
      '@babel/env',
    ],
    env: {
      test: {
        plugins: [
          [
            'istanbul',
            {
              exclude: ['test/**.js'],
            },
          ],
        ],
      },
    },
  };
};
