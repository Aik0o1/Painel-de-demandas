/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ["lucide-react"],

    // Configuração de Rewrites (Proxy transparente)
    async rewrites() {
        return [
            {
                // Encaminha as chamadas para a API em Python,
                // usando regex negativo (?!auth) para NOT interceptar as rotas nativas do NextAuth.
                source: '/api/:path((?!auth/).*)',
                destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/:path*`
            }
        ];
    }
};

export default nextConfig;
