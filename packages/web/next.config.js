/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@devlog/core', '@devlog/types'],
  webpack: (config, { isServer }) => {
    // Allow importing of workspace packages
    if (isServer) {
      // Handle externals for server-side rendering
      config.externals = config.externals || [];
      config.externals.push({
        '@devlog/core': 'commonjs @devlog/core',
        '@devlog/types': 'commonjs @devlog/types',
      });
    }
    
    return config;
  },
};

module.exports = nextConfig;
