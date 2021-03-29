const withTM = require('next-transpile-modules')([
  '@chatskee/knafeh',
  '@chatskee/tahini',
])

module.exports = withTM({
  images: {
    domains: ['res.cloudinary.com'],
  },
  webpack: (config, { isServer }) => {
    // Fixes packages that depend on fs/module module
    if (!isServer) {
      config.node = { fs: 'empty', module: 'empty' }
    }

    return config
  },
})
