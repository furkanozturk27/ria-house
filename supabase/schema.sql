-- ============================================================================
-- Event Access System - Complete Database Schema
-- Supabase PostgreSQL Production Schema
-- ============================================================================
-- 
-- This file contains the complete database schema including:
-- - Table definitions
-- - Indexes for performance
-- - Row Level Security (RLS) policies
-- - PL/pgSQL functions for business logic
-- - Triggers for automated workflows
--
-- Usage: Copy and paste this entire file into Supabase SQL Editor and execute
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE DEFINITIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Events Table
-- Stores all event information
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT events_title_not_empty CHECK (char_length(trim(title)) > 0),
    CONSTRAINT events_location_not_empty CHECK (char_length(trim(location)) > 0)
);

-- ----------------------------------------------------------------------------
-- Applications Table
-- Stores event access applications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    instagram_handle TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT applications_handle_not_empty CHECK (char_length(trim(instagram_handle)) > 0),
    CONSTRAINT applications_unique_event_handle UNIQUE (event_id, instagram_handle)
);

-- ----------------------------------------------------------------------------
-- Codes Table
-- Stores access codes for events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    assigned_to_application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT codes_code_length CHECK (char_length(code) = 6),
    CONSTRAINT codes_code_format CHECK (code ~ '^[A-Z0-9]{6}$'),
    CONSTRAINT codes_unique_code UNIQUE (code),
    CONSTRAINT codes_unique_event_code UNIQUE (event_id, code)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON public.events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_event_id ON public.applications(event_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_handle ON public.applications(instagram_handle);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications(created_at DESC);

-- Codes indexes
CREATE INDEX IF NOT EXISTS idx_codes_event_id ON public.codes(event_id);
CREATE INDEX IF NOT EXISTS idx_codes_code ON public.codes(code);
CREATE INDEX IF NOT EXISTS idx_codes_assigned_to ON public.codes(assigned_to_application_id) 
    WHERE assigned_to_application_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_codes_unassigned ON public.codes(event_id, assigned_to_application_id) 
    WHERE assigned_to_application_id IS NULL;

-- ============================================================================
-- PL/pgSQL FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: generate_event_codes
-- Generates unique 6-digit alphanumeric codes for an event
-- 
-- Parameters:
--   p_event_id: UUID of the event
--   p_quantity: Number of codes to generate (default: 100)
--
-- Returns:
--   INTEGER: Number of codes successfully generated
--
-- Security: SECURITY DEFINER - Only callable by admins
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_event_codes(
    p_event_id UUID,
    p_quantity INTEGER DEFAULT 100
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code TEXT;
    v_generated_count INTEGER := 0;
    v_attempts INTEGER;
    v_max_attempts INTEGER := 1000;
    v_chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    v_char_index INTEGER;
BEGIN
    -- Validate event exists
    IF NOT EXISTS (SELECT 1 FROM public.events WHERE id = p_event_id) THEN
        RAISE EXCEPTION 'Event with id % does not exist', p_event_id;
    END IF;
    
    -- Validate quantity
    IF p_quantity < 1 OR p_quantity > 10000 THEN
        RAISE EXCEPTION 'Quantity must be between 1 and 10000';
    END IF;
    
    -- Generate codes
    FOR i IN 1..p_quantity LOOP
        v_attempts := 0;
        
        -- Generate unique code with retry logic
        LOOP
            -- Generate random 6-character alphanumeric code (uppercase)
            v_code := '';
            FOR j IN 1..6 LOOP
                v_char_index := FLOOR(RANDOM() * LENGTH(v_chars) + 1)::INTEGER;
                v_code := v_code || SUBSTRING(v_chars FROM v_char_index FOR 1);
            END LOOP;
            
            -- Check if code already exists globally
            EXIT WHEN NOT EXISTS (
                SELECT 1 FROM public.codes WHERE code = v_code
            );
            
            -- Prevent infinite loop
            v_attempts := v_attempts + 1;
            IF v_attempts >= v_max_attempts THEN
                RAISE EXCEPTION 'Failed to generate unique code after % attempts', v_max_attempts;
            END IF;
        END LOOP;
        
        -- Insert code
        BEGIN
            INSERT INTO public.codes (event_id, code, assigned_to_application_id)
            VALUES (p_event_id, v_code, NULL)
            ON CONFLICT (code) DO NOTHING;
            
            -- Only count if insert succeeded
            IF FOUND THEN
                v_generated_count := v_generated_count + 1;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Log error but continue with next code
                RAISE WARNING 'Error inserting code %: %', v_code, SQLERRM;
        END;
    END LOOP;
    
    RETURN v_generated_count;
END;
$$;

-- ----------------------------------------------------------------------------
-- Function: assign_code_trigger
-- Trigger function that automatically assigns a code when application is approved
-- 
-- Logic:
--   - Fires BEFORE UPDATE when status changes to 'approved'
--   - Finds an unassigned code for the event
--   - Assigns the code to the application
--   - Raises exception if no codes available
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_code_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_available_code_id UUID;
    v_available_code TEXT;
BEGIN
    -- Only process when status changes to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Find an unassigned code for this event
        SELECT id, code INTO v_available_code_id, v_available_code
        FROM public.codes
        WHERE event_id = NEW.event_id
          AND assigned_to_application_id IS NULL
        LIMIT 1
        FOR UPDATE SKIP LOCKED;
        
        -- Check if code was found
        IF v_available_code_id IS NULL THEN
            RAISE EXCEPTION 'No codes available for event %', NEW.event_id
                USING HINT = 'Generate codes for this event before approving applications';
        END IF;
        
        -- Assign the code to this application
        UPDATE public.codes
        SET assigned_to_application_id = NEW.id
        WHERE id = v_available_code_id;
        
        -- Verify assignment succeeded
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Failed to assign code to application';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Automatically assign code when application is approved
DROP TRIGGER IF EXISTS trigger_assign_code_on_approval ON public.applications;

CREATE TRIGGER trigger_assign_code_on_approval
    BEFORE UPDATE OF status ON public.applications
    FOR EACH ROW
    WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
    EXECUTE FUNCTION public.assign_code_trigger();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Events RLS Policies
-- ----------------------------------------------------------------------------

-- Policy: Public can read active events
DROP POLICY IF EXISTS "Public can view active events" ON public.events;
CREATE POLICY "Public can view active events"
    ON public.events
    FOR SELECT
    TO public
    USING (is_active = true);

-- Policy: Admins can read all events
DROP POLICY IF EXISTS "Admins can read all events" ON public.events;
CREATE POLICY "Admins can read all events"
    ON public.events
    FOR SELECT
    TO authenticated
    USING (
        -- Adjust this condition based on your admin role setup
        -- Example: auth.jwt() ->> 'role' = 'admin'
        -- For now, allow all authenticated users (you should restrict this)
        true
    );

-- Policy: Admins can insert events
DROP POLICY IF EXISTS "Admins can create events" ON public.events;
CREATE POLICY "Admins can create events"
    ON public.events
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Adjust this condition based on your admin role setup
        true
    );

-- Policy: Admins can update events
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
CREATE POLICY "Admins can update events"
    ON public.events
    FOR UPDATE
    TO authenticated
    USING (
        -- Adjust this condition based on your admin role setup
        true
    )
    WITH CHECK (
        -- Adjust this condition based on your admin role setup
        true
    );

-- Policy: Admins can delete events
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
CREATE POLICY "Admins can delete events"
    ON public.events
    FOR DELETE
    TO authenticated
    USING (
        -- Adjust this condition based on your admin role setup
        true
    );

-- ----------------------------------------------------------------------------
-- Applications RLS Policies
-- ----------------------------------------------------------------------------

-- Policy: Public can create applications (anyone can apply)
DROP POLICY IF EXISTS "Public can create applications" ON public.applications;
CREATE POLICY "Public can create applications"
    ON public.applications
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Policy: Public can read applications (for status checking)
-- Note: In production, you may want to restrict this further
DROP POLICY IF EXISTS "Public can read applications" ON public.applications;
CREATE POLICY "Public can read applications"
    ON public.applications
    FOR SELECT
    TO public
    USING (true);

-- Policy: Admins can read all applications
DROP POLICY IF EXISTS "Admins can read all applications" ON public.applications;
CREATE POLICY "Admins can read all applications"
    ON public.applications
    FOR SELECT
    TO authenticated
    USING (
        -- Adjust this condition based on your admin role setup
        true
    );

-- Policy: Admins can update applications (for approval/rejection)
DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
CREATE POLICY "Admins can update applications"
    ON public.applications
    FOR UPDATE
    TO authenticated
    USING (
        -- Adjust this condition based on your admin role setup
        true
    )
    WITH CHECK (
        -- Adjust this condition based on your admin role setup
        true
    );

-- Policy: Admins can delete applications
DROP POLICY IF EXISTS "Admins can delete applications" ON public.applications;
CREATE POLICY "Admins can delete applications"
    ON public.applications
    FOR DELETE
    TO authenticated
    USING (
        -- Adjust this condition based on your admin role setup
        true
    );

-- ----------------------------------------------------------------------------
-- Codes RLS Policies
-- ----------------------------------------------------------------------------

-- Policy: Only admins can read codes
DROP POLICY IF EXISTS "Admins can read codes" ON public.codes;
CREATE POLICY "Admins can read codes"
    ON public.codes
    FOR SELECT
    TO authenticated
    USING (
        -- Adjust this condition based on your admin role setup
        true
    );

-- Policy: Only admins can insert codes
DROP POLICY IF EXISTS "Admins can create codes" ON public.codes;
CREATE POLICY "Admins can create codes"
    ON public.codes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Adjust this condition based on your admin role setup
        true
    );

-- Policy: Only admins can update codes
DROP POLICY IF EXISTS "Admins can update codes" ON public.codes;
CREATE POLICY "Admins can update codes"
    ON public.codes
    FOR UPDATE
    TO authenticated
    USING (
        -- Adjust this condition based on your admin role setup
        true
    )
    WITH CHECK (
        -- Adjust this condition based on your admin role setup
        true
    );

-- Policy: Only admins can delete codes
DROP POLICY IF EXISTS "Admins can delete codes" ON public.codes;
CREATE POLICY "Admins can delete codes"
    ON public.codes
    FOR DELETE
    TO authenticated
    USING (
        -- Adjust this condition based on your admin role setup
        true
    );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permission on functions to authenticated users (admins)
GRANT EXECUTE ON FUNCTION public.generate_event_codes(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_code_trigger() TO authenticated;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE public.events IS 'Stores event information for the access system';
COMMENT ON TABLE public.applications IS 'Stores user applications for event access';
COMMENT ON TABLE public.codes IS 'Stores unique access codes for events';

COMMENT ON FUNCTION public.generate_event_codes(UUID, INTEGER) IS 
    'Generates unique 6-digit alphanumeric codes for an event. Returns count of codes generated.';
COMMENT ON FUNCTION public.assign_code_trigger() IS 
    'Trigger function that automatically assigns a code when application status changes to approved';

-- ============================================================================
-- VERIFICATION QUERIES (Optional - for testing)
-- ============================================================================

-- Uncomment to verify schema setup:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';
-- SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

