# Supabase Integration Setup Guide

## Step 1: Create Environment Variables File

Create a file named `.env.local` in the root directory with the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**To get your Supabase credentials:**
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the **Project URL** → paste as `NEXT_PUBLIC_SUPABASE_URL`
5. Copy the **anon/public key** → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 2: Run Database Schema

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase/schema.sql` from this project
4. Copy the **entire contents** of `schema.sql`
5. Paste into the Supabase SQL Editor
6. Click **Run** to execute

This will create:
- ✅ All tables (events, applications, codes)
- ✅ Indexes for performance
- ✅ RLS policies for security
- ✅ PL/pgSQL functions (generate_event_codes, assign_code_trigger)
- ✅ Triggers for automatic code assignment

## Step 3: Verify Setup

After running the schema, verify in Supabase:

1. **Tables**: Go to **Table Editor** → You should see `events`, `applications`, `codes`
2. **Functions**: Go to **Database** → **Functions** → You should see `generate_event_codes`
3. **Policies**: Go to **Authentication** → **Policies** → Verify RLS is enabled

## Step 4: Test the Integration

The application will now use Supabase instead of mock data. The `lib/supabaseClient.ts` file has been updated with proper error handling.

### Testing Code Generation

In Supabase SQL Editor, test the code generation function:

```sql
-- First, create a test event
INSERT INTO events (title, date, location, is_active)
VALUES ('Test Event', NOW() + INTERVAL '7 days', 'Test Location', true)
RETURNING id;

-- Then generate codes (replace EVENT_ID with the returned UUID)
SELECT generate_event_codes('EVENT_ID'::UUID, 10);
```

## Security Notes

⚠️ **Important**: The RLS policies currently allow all authenticated users to perform admin actions. You should update the policies to check for a specific admin role:

```sql
-- Example: Update admin policies to check for role
-- Replace 'true' with: auth.jwt() ->> 'role' = 'admin'
-- Or use: auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
```

## Troubleshooting

### Error: "Supabase configuration error"
- Make sure `.env.local` exists in the root directory
- Verify the environment variable names are exactly as shown
- Restart your Next.js dev server after creating `.env.local`

### Error: "No codes available"
- Make sure you've generated codes for the event using `generate_event_codes()`
- Check that codes exist: `SELECT * FROM codes WHERE event_id = 'YOUR_EVENT_ID'`

### RLS Policy Errors
- Verify RLS is enabled on all tables
- Check that policies are created correctly
- For admin access, ensure you're authenticated in Supabase

## Next Steps

1. ✅ Set up authentication for admin routes
2. ✅ Implement admin role checking in RLS policies
3. ✅ Add email notifications for application status
4. ✅ Set up Supabase Realtime for live updates

