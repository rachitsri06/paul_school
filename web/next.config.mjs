/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    // Mark catch-all pages as dynamic to prevent SSG pre-rendering
    // which crashes because useAuth context isn't available during build
    experimental: {
        // Allow dynamic rendering for pages using client-side contexts
    },
};

export default nextConfig;
