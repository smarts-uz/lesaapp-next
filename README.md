# LESA POS System

A modern Point of Sale (POS) system built with Next.js and Prisma, designed for construction and scaffolding businesses.

## 🚀 Features

- **Modern UI**: Built with Radix UI components and Tailwind CSS
- **Real-time Inventory**: Direct integration with WooCommerce database
- **Bundle Products**: Support for complex product bundles and kits
- **Responsive Design**: Works seamlessly across all devices
- **Type Safety**: Full TypeScript support
- **Database Integration**: Seamless integration with existing WooCommerce database

## 🛠️ Tech Stack

- **Framework**: Next.js 15.2.4
- **Database**: MySQL (via Prisma)
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript
- **Form Handling**: React Hook Form
- **Data Validation**: Zod
- **Date Handling**: date-fns
- **Charts**: Recharts
- **Printing**: react-to-print

## 📋 Prerequisites

- Node.js 18+ 
- MySQL database
- WooCommerce installation

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/lesaapp-next.git
cd lesaapp-next
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your database credentials and other configuration.

4. Initialize Prisma and sync database:
```bash
# Pull existing database schema and generate client
npm run db

# Open Prisma Studio to view/edit data
npm run studio
```

5. Run the development server:
```bash
npm run dev
```

## 🗄️ Database Management

### Available Commands

```bash
# Pull database schema and generate client
npm run db

# Open Prisma Studio GUI
npm run studio
```

### Database Updates

When the WooCommerce database changes:

1. Sync the database:
```bash
npm run db
```

2. Review changes in `prisma/schema.prisma`

## 🏗️ Build

To build for production:

```bash
npm run build
```

To start the production server:

```bash
npm start
```

## 📁 Project Structure

```
lesaapp-next/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/                   # Utility functions and configurations
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── types/                # TypeScript type definitions
```

## 🔒 Environment Variables

Required environment variables:

```env
DATABASE_URL="mysql://user:password@localhost:3306/database"
```

## 📝 License

This project is private and proprietary. All rights reserved.

## 👥 Contributing

This is a private project. Please contact the maintainers for any questions or issues.

## 📞 Support

For support, please contact the development team or raise an issue in the repository.

# Next.js Internationalization with App Router

This project demonstrates a complete internationalization (i18n) setup for Next.js using the App Router.

## Project Structure

```
/
├── app/
│   ├── [locale]/      # Dynamic locale routes
│   │   ├── page.tsx   # Home page with locale parameter
│   │   ├── layout.tsx # Layout for localized pages
│   │   └── dashboard/ # Localized dashboard feature
│   └── page.tsx       # Root page that redirects to default locale
├── components/
│   ├── i18n-provider.jsx     # Provider component for i18next
│   ├── language-switcher.tsx # Reusable language switcher
│   └── dashboard/            # Dashboard components
├── lib/
│   └── i18n.js        # i18next configuration
├── middleware.ts      # Handles locale detection and routing
└── public/
    └── locales/       # Translation files
        ├── en.json    # English translations
        ├── ru.json    # Russian translations
        └── uz.json    # Uzbek translations
```

## How it Works

1. **Route Structure**: Using Next.js App Router's dynamic segments with `[locale]` parameter
2. **Middleware**: Automatically detects user's preferred language and redirects to the appropriate locale
3. **i18next Integration**: Uses react-i18next for translations
4. **Language Switching**: Changes the URL to the selected language path

## Key Features

- Locale detection based on user's browser language
- Language switching with proper URL updates
- Centralized translation files (one file per language)
- Support for server and client components

## Adding a New Language

1. Add the language to the `languages` array in `lib/i18n.js`
2. Create a new translation file in `public/locales/[lang-code].json`
3. That's it! The middleware and language switcher will automatically support the new language

## Usage in Components

### Client Components

```tsx
'use client';
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t } = useTranslation();
  
  return <h1>{t('greeting', 'Hello World')}</h1>;
}
```

### Creating Links

Use the `getLocalizedPath` helper to create localized links:

```tsx
import { getLocalizedPath } from '@/lib/i18n';

// In a component with params.locale available
<a href={getLocalizedPath('/dashboard', locale)}>Dashboard</a>
```

## Middleware

The middleware automatically handles:
- Detecting the user's preferred language
- Redirecting from the root path (/) to the localized path (e.g., /en)
- Preserving the path when switching languages

## Translation Files

Translations are stored in JSON files in the `public/locales` directory. Each language has its own file:

- `en.json` - English translations
- `ru.json` - Russian translations
- `uz.json` - Uzbek translations

Format:

```json
{
  "key": "Translated Text",
  "nested.key": "Nested Translated Text"
}
```

## Running the Project

```
npm install
npm run dev
```

Navigate to http://localhost:3000 to see the application in action.