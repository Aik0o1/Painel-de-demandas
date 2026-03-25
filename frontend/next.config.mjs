/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ["lucide-react"],
    output: 'standalone', // Modo de alta performance para produção no Docker


    // Configuração de Rewrites (Proxy transparente)
    async rewrites() {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.FASTAPI_URL || 'http://backend:8001';
        console.log(`[NextConfig] Definindo rewrite de /api/* para ${apiUrl}/api/*`);
        return [
            {
                // Encaminha as chamadas para a API em Python,
                // usando regex negativo (?!auth) para NOT interceptar as rotas nativas do NextAuth.
                source: '/api/:path((?!auth/).*)',
                destination: `${apiUrl}/api/:path*`
            }
        ];
    }
};

export default nextConfig;

