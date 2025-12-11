-- Event Access System Database Schema
-- Supabase PostgreSQL Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events Table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    location TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications Table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    instagram_handle TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, instagram_handle)
);

-- Codes Table
CREATE TABLE codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    is_used BOOLEAN DEFAULT false,
    assigned_to_application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, code)
);

-- Indexes for performance
CREATE INDEX idx_applications_event_id ON applications(event_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_codes_event_id ON codes(event_id);
CREATE INDEX idx_codes_is_used ON codes(is_used);
CREATE INDEX idx_codes_code ON codes(code);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_is_active ON events(is_active);

-- Function to automatically assign code when application is approved
CREATE OR REPLACE FUNCTION assign_code_to_application()
RETURNS TRIGGER AS $$
DECLARE
    available_code RECORD;
BEGIN
    -- Only proceed if status changed to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Find an unused code for this event
        SELECT * INTO available_code
        FROM codes
        WHERE event_id = NEW.event_id
          AND is_used = false
          AND assigned_to_application_id IS NULL
        LIMIT 1
        FOR UPDATE SKIP LOCKED;
        
        -- If code found, assign it
        IF available_code IS NOT NULL THEN
            UPDATE codes
            SET is_used = true,
                assigned_to_application_id = NEW.id
            WHERE id = available_code.id;
            
            -- Update approved_at timestamp
            NEW.approved_at = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically assign codes
CREATE TRIGGER trigger_assign_code_on_approval
    AFTER UPDATE OF status ON applications
    FOR EACH ROW
    WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
    EXECUTE FUNCTION assign_code_to_application();

-- Function to generate random 6-digit codes
CREATE OR REPLACE FUNCTION generate_event_codes(
    p_event_id UUID,
    p_count INTEGER DEFAULT 100
)
RETURNS INTEGER AS $$
DECLARE
    v_code TEXT;
    v_count INTEGER := 0;
BEGIN
    FOR i IN 1..p_count LOOP
        -- Generate unique 6-digit code
        LOOP
            v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
            
            -- Check if code already exists
            EXIT WHEN NOT EXISTS (
                SELECT 1 FROM codes WHERE code = v_code
            );
        END LOOP;
        
        -- Insert code
        INSERT INTO codes (event_id, code, is_used)
        VALUES (p_event_id, v_code, false)
        ON CONFLICT (code) DO NOTHING;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE codes ENABLE ROW LEVEL SECURITY;

-- Public can read active events
CREATE POLICY "Public can view active events"
    ON events FOR SELECT
    USING (is_active = true AND is_archived = false);

-- Public can create applications
CREATE POLICY "Public can create applications"
    ON applications FOR INSERT
    WITH CHECK (true);

-- Public can read their own applications
CREATE POLICY "Public can view own applications"
    ON applications FOR SELECT
    USING (true);

-- Admin policies (adjust based on your auth setup)
-- These assume you have an admin role or user metadata
-- CREATE POLICY "Admins can manage events"
--     ON events FOR ALL
--     USING (auth.jwt() ->> 'role' = 'admin');

-- CREATE POLICY "Admins can manage applications"
--     ON applications FOR ALL
--     USING (auth.jwt() ->> 'role' = 'admin');

-- CREATE POLICY "Admins can manage codes"
--     ON codes FOR ALL
--     USING (auth.jwt() ->> 'role' = 'admin');

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

