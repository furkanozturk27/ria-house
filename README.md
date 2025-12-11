# Event Access System

An exclusive private event access system for high-profile nightclub events. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Public Event Portal**: Browse and apply for exclusive events
- **Application System**: Submit Instagram handle for event access
- **QR Code Generation**: Automatic QR code generation for approved applications
- **Admin Dashboard**: Manage events, applications, and access codes
- **Dark Luxury Theme**: Premium UI with gold accents and minimalist design

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **UI Components**: shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Icons**: Lucide React
- **QR Codes**: react-qr-code

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (optional for development - mock data is included)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (create `.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup

1. Create a new Supabase project
2. Run the migration file located in `supabase/migrations/001_initial_schema.sql`
3. Configure Row Level Security policies based on your authentication setup

## Project Structure

```
├── app/
│   ├── (public)/
│   │   └── page.tsx          # Public event listing page
│   ├── admin/
│   │   ├── page.tsx          # Admin dashboard
│   │   └── events/
│   │       └── [id]/
│   │           └── page.tsx  # Event detail management
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles with luxury theme
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── ApplicationForm.tsx   # Application submission form
│   └── ApplicationStatus.tsx # Application status display
├── lib/
│   ├── types.ts              # TypeScript interfaces
│   ├── mockData.ts           # Mock data for development
│   ├── supabaseClient.ts     # Supabase client configuration
│   └── utils.ts              # Utility functions
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql  # Database schema
```

## Features in Detail

### Public Portal
- View active and upcoming events
- Apply for event access with Instagram handle
- Check application status
- View assigned access code and QR code (if approved)

### Admin Dashboard
- Create and manage events
- Generate access codes (100 at a time)
- Review and approve/reject applications
- View application statistics

## Design System

### Colors
- **Background**: `#050505` (Deep Black)
- **Secondary**: `#1A1A1A` (Dark Gray)
- **Accent**: `#D4AF37` (Metallic Gold)
- **Border**: `#383838` (Medium Gray)

### Typography
- **Font**: Inter (via Next.js)
- **Headers**: Wide letter spacing (0.1em)
- **Style**: Clean, minimalist, luxury aesthetic

## Development Notes

- The app uses mock data by default if Supabase is not configured
- All components are mobile-first and fully responsive
- TypeScript interfaces ensure type safety throughout
- Enterprise-grade code structure with clear separation of concerns

## License

Private - All rights reserved

