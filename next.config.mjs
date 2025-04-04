let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru', 'uz'],
    localeDetection: true,
  }
}

// Merge user config with default config
if (userConfig) {
  Object.entries(userConfig).forEach(([key, value]) => {
    if (typeof nextConfig[key] === 'object' && !Array.isArray(nextConfig[key])) {
      nextConfig[key] = { ...nextConfig[key], ...value }
    } else {
      nextConfig[key] = value
    }
  })
}

export default nextConfig
