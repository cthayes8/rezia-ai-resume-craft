/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // Change to your site URL, or set via NEXT_PUBLIC_SITE_URL environment variable
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://Reslo.ai',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    // Additional options if needed
  },
  // Exclude any dynamic or private routes here
  exclude: ['/dashboard/*', '/api/*'],
};