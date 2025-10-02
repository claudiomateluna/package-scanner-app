-- Add password requirements fields to profiles table

-- Add field to track if user needs to change password on next login
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;

-- Add field to track when password was last changed
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_last_changed TIMESTAMP DEFAULT NOW();

-- Add field to store password history (JSON array of hashed passwords)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_history JSONB DEFAULT '[]';

-- Add index for efficient querying of users who must change password
CREATE INDEX IF NOT EXISTS idx_profiles_must_change_password ON profiles(must_change_password);

-- Add index for efficient password change tracking
CREATE INDEX IF NOT EXISTS idx_profiles_password_last_changed ON profiles(password_last_changed);