import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: true, // Disabled to fix Vercel Serverless Function 404s with NextAuth
  workboxOptions: {
    disableDevLogs: true,
    exclude: [/api\/.*$/], // Don't cache API routes
  }
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

export default withPWA(nextConfig);
