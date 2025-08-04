# Wedding Planner v3 - Clean Next.js 14 Application

A modern, clean wedding planning application built with Next.js 14, TypeScript, Tailwind CSS, and Clerk authentication.

## ✨ Features

- **Clean Architecture**: Fresh Next.js 14 with App Router
- **Authentication**: Clerk authentication integration
- **Modern UI**: Radix UI components with Tailwind CSS
- **TypeScript**: Full TypeScript support with strict configuration
- **Responsive Design**: Mobile-first responsive design
- **No Lazy Loading Issues**: Direct imports throughout the application

## 🚀 Tech Stack

- **Framework**: Next.js 14.2.25
- **Language**: TypeScript
- **Authentication**: Clerk
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS
- **State Management**: React Server Components
- **Development**: ESLint, PostCSS

## 📦 Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file with your Clerk credentials:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
   CLERK_SECRET_KEY=your_clerk_secret_key_here
   
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

The application will be available at [http://localhost:4001](http://localhost:4001).

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard pages
│   │   ├── budget/        # Budget management
│   │   ├── checklist/     # Wedding checklist
│   │   ├── guests/        # Guest management
│   │   ├── photos/        # Photo gallery
│   │   ├── settings/      # Settings page
│   │   ├── vendors/       # Vendor management
│   │   ├── layout.tsx     # Dashboard layout
│   │   └── page.tsx       # Dashboard home
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # Reusable components
│   ├── ui/               # UI components (Button, Card, etc.)
│   └── MobileNav.tsx     # Mobile navigation
├── lib/                  # Utility functions
│   └── utils.ts          # Class utility functions
├── hooks/                # Custom React hooks
└── types/                # TypeScript type definitions
```

## 🎨 UI Components

The application includes a comprehensive UI component library built with Radix UI:

- **Button**: Versatile button component with variants
- **Card**: Container component for content sections
- **Input**: Form input component
- **Label**: Form label component
- **Sheet**: Slide-out panel for mobile navigation

## 📱 Features Overview

### 🏠 Dashboard
- Overview of wedding planning progress
- Quick stats and activity feed
- Navigation to all features

### 💰 Budget Management
- Track wedding expenses
- Budget breakdown by category
- Recent expenses list

### 👥 Guest Management
- Guest list with RSVP tracking
- Guest search and filtering
- Response rate statistics

### 🏪 Vendor Management
- Vendor directory and search
- Vendor status tracking
- Contact management

### 📋 Wedding Checklist
- Timeline-based task organization
- Progress tracking
- Task completion status

### 📸 Photo Gallery
- Organized photo albums
- Category-based organization
- Upload functionality placeholder

### ⚙️ Settings
- Wedding details configuration
- Budget preferences
- Notification settings
- Account management

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Type checking
npm run typecheck
```

## 🔐 Authentication Setup

This application uses Clerk for authentication. To set up:

1. Create a Clerk account at [https://clerk.com](https://clerk.com)
2. Create a new application
3. Copy your publishable key and secret key
4. Add them to your `.env.local` file
5. Configure your application settings in the Clerk dashboard

## 📱 Mobile Responsive Design

The application is built with a mobile-first approach:

- **Responsive Navigation**: Mobile hamburger menu with slide-out panel
- **Flexible Grid Layouts**: Adapts to different screen sizes
- **Touch-Friendly Interface**: Optimized for mobile interactions
- **Consistent Spacing**: Responsive padding and margins

## 🚀 Deployment

The application is ready for deployment on platforms like Vercel, Netlify, or any Node.js hosting service.

### Environment Variables Required:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`

## 🎯 Key Improvements in v3

- **Clean Architecture**: No lazy loading issues, direct imports
- **Modern Stack**: Latest Next.js 14 with App Router
- **Better UX**: Improved navigation and responsive design
- **Type Safety**: Comprehensive TypeScript configuration
- **Performance**: Optimized build and runtime performance
- **Maintainability**: Clean code structure and organization

## 📝 Next Steps

To complete the application:

1. **Connect to Database**: Add Prisma or your preferred database solution
2. **Add Real Data**: Connect to actual data sources
3. **Implement Features**: Add form submissions and data persistence
4. **Add Tests**: Implement unit and integration tests
5. **Enhance UI**: Add more interactive features and animations

## 🤝 Contributing

This is a clean, production-ready foundation for a wedding planning application. Feel free to extend and customize based on your specific requirements.