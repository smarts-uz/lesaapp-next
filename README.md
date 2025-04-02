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
# Pull existing database schema
npm run prisma:pull

# Generate Prisma client
npm run prisma:generate

# Push schema changes to database (if needed)
npm run prisma:push
```

5. Run the development server:
```bash
npm run dev
```

## 🗄️ Database Management

### Available Commands

```bash
# Sync database schema and generate client
npm run db

# Open database GUI
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