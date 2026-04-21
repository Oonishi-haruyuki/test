/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: {
            allowedOrigins: ['*.app.github.dev', 'localhost:3000', 'localhost:3001'],
        },
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
                port: '',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'picsum.photos',
                port: '',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'via.placeholder.com',
                port: '',
                pathname: '**',
            }
        ],
    },
};

export default nextConfig;
