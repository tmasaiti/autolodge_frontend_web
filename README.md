# AutoLodge Frontend Web Application

A comprehensive React-based frontend web application for the AutoLodge vehicle rental marketplace in the SADC region.

## Technology Stack

- **React 18** - Modern React with hooks and concurrent features
- **Vite** - Fast development and optimized production builds
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework for responsive design
- **Redux Toolkit** - Predictable state management
- **React Router v6** - Declarative routing with data loading
- **Axios** - HTTP client with interceptors
- **Ajv** - JSON schema validation for complex data structures
- **Vitest + React Testing Library** - Fast testing with React components

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Input, Modal)
│   ├── forms/          # Form components with JSON schema validation
│   ├── layout/         # Layout components (Header, Footer, Sidebar)
│   ├── marketplace/    # Marketplace-specific components
│   └── dashboard/      # Dashboard components
├── pages/              # Route components
├── store/              # Redux store and slices
│   ├── slices/         # Redux Toolkit slices
│   ├── store.ts        # Store configuration
│   └── hooks.ts        # Typed Redux hooks
├── services/           # API service layer
├── utils/              # Utility functions and JSON validation
├── types/              # TypeScript type definitions
└── test-setup.ts       # Test configuration
```

## Available Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## Features Implemented

### Core Infrastructure ✅
- React + Vite project setup with TypeScript
- Tailwind CSS configuration for responsive design
- Redux Toolkit for state management
- React Router v6 for navigation
- Axios for API communication
- Ajv for JSON schema validation
- Vitest + React Testing Library for testing

### State Management
- User state (authentication, profile, KYC)
- Vehicle state (listings, search results)
- Booking state (current booking, history)
- Search state (filters, results, saved searches)

### JSON Data Handling
- User profile validation (addresses, preferences)
- Vehicle specifications validation
- Generic JSON data handler utility
- Schema-based validation with Ajv

### UI Components
- Responsive layout with Header and Footer
- Basic page structure for all main routes
- Tailwind CSS utility classes and components
- Mobile-first responsive design

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# Feature Flags
VITE_ENABLE_CROSS_BORDER=true
VITE_ENABLE_INSURANCE=true
VITE_ENABLE_DISPUTES=true

# External Services
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
```

## Next Steps

The core infrastructure is complete. Future tasks will implement:

1. JSON Data Handling System (Task 2)
2. Core UI Component Library (Task 3)
3. Wizard-Based Complex Forms (Task 4)
4. Search and Discovery System (Task 5)
5. Multi-Currency Display System (Task 6)
6. And more advanced features...

## Development

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Open http://localhost:3001 in your browser
4. Run tests: `npm test`

The application is now ready for implementing the remaining features according to the task list.