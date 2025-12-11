# Setup Instructions

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- Supabase Client
- react-qr-code
- shadcn/ui dependencies

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note**: The app works with mock data if Supabase is not configured, so you can skip this step for initial development.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the public portal.

Access the admin dashboard at [http://localhost:3000/admin](http://localhost:3000/admin)

## Database Setup (Optional)

If you want to use Supabase instead of mock data:

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Run the migration
5. Update your `.env.local` with the Supabase credentials

## Project Structure

```
eventcoder/
├── app/
│   ├── admin/              # Admin dashboard routes
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Public home page
│   └── globals.css         # Luxury theme styles
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── ApplicationForm.tsx
│   └── ApplicationStatus.tsx
├── lib/
│   ├── types.ts            # TypeScript interfaces
│   ├── mockData.ts         # Development mock data
│   ├── supabaseClient.ts   # Supabase configuration
│   └── utils.ts            # Utility functions
└── supabase/
    └── migrations/         # Database migrations
```

## Features

### Public Portal (`/`)
- View active and upcoming events
- Apply for event access
- Check application status
- View QR code for approved applications

### Admin Dashboard (`/admin`)
- View event statistics
- Manage events
- Generate access codes
- Approve/reject applications

## Development Notes

- All components are fully typed with TypeScript
- Mock data is used when Supabase is not configured
- UI is mobile-first and fully responsive
- Dark luxury theme with gold accents throughout

## Next Steps

1. Customize the theme colors in `app/globals.css`
2. Add authentication to admin routes
3. Connect to Supabase for production
4. Add email notifications for application status
5. Implement real-time updates with Supabase Realtime

