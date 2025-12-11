-- Add device_info column to applications table
-- This stores the user agent string for device fingerprinting

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS device_info TEXT;

-- Add index for potential queries on device info
CREATE INDEX IF NOT EXISTS idx_applications_device_info ON public.applications(device_info);

-- Add comment for documentation
COMMENT ON COLUMN public.applications.device_info IS 'User agent string captured from the browser when application was submitted';

