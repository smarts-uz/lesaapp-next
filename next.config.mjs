let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['placeholder.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: true,
  },
  // Add redirects configuration for dashboard paths
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/en/dashboard',
        permanent: false,
      },
      {
        source: '/dashboard/:path*',
        destination: '/en/dashboard/:path*',
        permanent: false,
      }
    ]
  },
}

// Carefully merge user config while preserving our redirects
mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    // Skip redirects to avoid overwriting our dashboard redirects
    if (key === 'redirects') continue;
    
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      nextConfig[key] = userConfig[key]
    }
  }
}

export default nextConfig
