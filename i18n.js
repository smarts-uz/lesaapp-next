const path = require('path');

module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru', 'uz'],
    localeDetection: true,
    localePath: path.resolve('./public/locales')
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  ns: ['common', 'home', 'pos', 'dashboard', 'components'],
  defaultNS: 'common',
} 