# Overview

This is a modern AI chat platform built with React, Express.js, and PostgreSQL. The application provides a multi-model AI chat experience where users can interact with various AI models through an intuitive web interface. It features user authentication via Replit's OAuth system, admin controls for model management, and comprehensive chat session management. The platform integrates with OpenRouter to access multiple AI models and maintains a clean, responsive design using shadcn/ui components.

The platform now includes advanced features like rich text markdown responses, voice input capabilities, file upload functionality (coming soon), model comparison tools, and a fully responsive mobile-first design with bottom navigation bar for mobile devices.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for development and build processes
- **UI Library**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod for validation
- **Rich Content**: ReactMarkdown with remark-gfm, remark-breaks, and rehype-highlight for AI response formatting
- **Voice Input**: Web Speech API integration for hands-free chat interaction
- **Responsive Design**: Mobile-first approach with collapsible sidebar and bottom navigation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Authentication**: Replit's OpenID Connect (OIDC) authentication system with Passport.js
- **Session Management**: Express sessions stored in PostgreSQL using connect-pg-simple
- **API Design**: RESTful endpoints with structured error handling and request logging

## Database Design
- **Users Table**: Stores user profiles with role-based access control (user/admin)
- **AI Models Table**: Manages available AI models with provider information and pricing
- **Chat Sessions Table**: Tracks user chat sessions with metadata
- **Chat Messages Table**: Stores individual messages with role and content
- **Sessions Table**: Required for Replit auth session storage
- **System Settings Table**: Configuration storage for API keys and system preferences

## Authentication & Authorization
- **OAuth Provider**: Replit's OIDC system for seamless authentication
- **Role-Based Access**: User and admin roles with protected admin routes
- **Session Security**: HTTP-only secure cookies with configurable TTL
- **Route Protection**: Middleware-based authentication checks for API endpoints

## AI Integration
- **Service Layer**: OpenRouterService class for unified AI model access
- **Model Management**: Admin-configurable AI models with cost tracking
- **Chat Processing**: Streaming support for real-time chat responses
- **Error Handling**: Graceful degradation for AI service failures
- **Model Comparison**: Side-by-side AI model response comparison tool
- **Voice Integration**: Speech-to-text for voice input with browser Speech API
- **File Upload**: Drag-and-drop file upload component (AI analysis integration coming soon)

# External Dependencies

## Core Services
- **Neon Database**: PostgreSQL hosting with serverless connection pooling
- **OpenRouter API**: Multi-model AI access platform for chat completions
- **Replit Authentication**: OAuth 2.0/OIDC identity provider

## Development Tools
- **Replit Environment**: Integrated development environment with auto-configuration
- **Vite Plugins**: Development server with HMR and error overlay
- **TypeScript**: Full type safety across frontend and backend

## UI Dependencies
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide Icons**: Consistent icon library for UI elements
- **FontAwesome**: Additional icons for branding and navigation

## Utility Libraries
- **Zod**: Schema validation for forms and API requests
- **date-fns**: Date manipulation and formatting
- **clsx**: Conditional CSS class management
- **nanoid**: Unique ID generation for entities