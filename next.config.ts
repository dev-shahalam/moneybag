const nextPWA = require('next-pwa');

const withPWA = nextPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  // Turbopack কনফ্লিক্ট দূর করার জন্য এই লাইনটি যুক্ত করা হলো
  turbopack: {},
};

export default withPWA(nextConfig);