/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        // !! WARN !!
        // Dangerously allow production builds to successfully complete even if
        // your project has type errors.
        // !! WARN !!
        ignoreBuildErrors: true,
    },
    eslint: {
        // Warning: This allows production builds to successfully complete even if
        // your project has ESLint errors.
        ignoreDuringBuilds: true,
    },
    experimental: {
        // Use the correct property name for external packages
        serverExternalPackages: ['@prisma/client', 'bcryptjs'],
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            // Don't bundle server-only libraries in client-side code
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                child_process: false,
                'fs/promises': false,
                async_hooks: false,
                net: false,
                tls: false,
                os: false,
                path: false,
            };
        }
        return config;
    },
};

module.exports = nextConfig;
