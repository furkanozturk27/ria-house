-- ============================================================================
-- Fix Double Code Assignment Bug
-- ============================================================================
-- 
-- Problem: Approving an application consumes 2 codes instead of 1
-- Root Cause: Trigger function doesn't check if application already has a code
-- Solution: Add strict check to prevent re-assignment
--
-- Run this script in Supabase SQL Editor
-- ============================================================================

-- Step 1: Update the trigger function to check if code already exists
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
        
        -- CRITICAL FIX: Check if this application already has a code assigned
        -- This prevents double assignment if trigger runs multiple times
        IF EXISTS (
            SELECT 1 
            FROM public.codes 
            WHERE assigned_to_application_id = NEW.id
        ) THEN
            -- Application already has a code, skip assignment
            RETURN NEW;
        END IF;
        
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

-- Step 2: Verify trigger is still active (should already exist, but ensure it's correct)
DROP TRIGGER IF EXISTS trigger_assign_code_on_approval ON public.applications;

CREATE TRIGGER trigger_assign_code_on_approval
    BEFORE UPDATE OF status ON public.applications
    FOR EACH ROW
    WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
    EXECUTE FUNCTION public.assign_code_trigger();

-- ============================================================================
-- OPTIONAL: Data Cleanup Script (Run only if you want to reset for testing)
-- ============================================================================
-- 
-- WARNING: This will reset all approved applications and free up their codes
-- Only run this if you want to start fresh for testing purposes
-- 
-- Uncomment the following lines if you want to reset:

/*
-- Reset all approved applications back to pending
UPDATE public.applications
SET status = 'pending'
WHERE status = 'approved';

-- Free up all assigned codes
UPDATE public.codes
SET assigned_to_application_id = NULL
WHERE assigned_to_application_id IS NOT NULL;
*/

-- ============================================================================
-- Verification Query (Run this to check for duplicate assignments)
-- ============================================================================
-- 
-- This query will show if any application has multiple codes assigned
-- (Should return 0 rows if everything is correct)

/*
SELECT 
    a.id as application_id,
    a.instagram_handle,
    a.status,
    COUNT(c.id) as code_count,
    STRING_AGG(c.code, ', ') as assigned_codes
FROM public.applications a
LEFT JOIN public.codes c ON c.assigned_to_application_id = a.id
WHERE a.status = 'approved'
GROUP BY a.id, a.instagram_handle, a.status
HAVING COUNT(c.id) > 1;
*/

-- ============================================================================
-- End of Fix
-- ============================================================================

