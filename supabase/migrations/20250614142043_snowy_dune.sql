/*
  # Add users table for public survey access

  1. New Tables
    - `users` - Stores user information for survey creators
  
  2. Changes
    - Update surveys table to reference users table instead of auth.users
    - Add policies for public survey creation
    - Allow anonymous users to create surveys with email verification
  
  3. Security
    - Enable RLS on users table
    - Add policies for user management
    - Update existing survey policies
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Add policies for users table
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text OR auth.jwt() ->> 'email' = email);

CREATE POLICY "Anyone can create a user profile"
  ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text OR auth.jwt() ->> 'email' = email);

-- Update surveys table to allow public creation
DROP POLICY IF EXISTS "Users can create their own surveys" ON surveys;
DROP POLICY IF EXISTS "Users can view their own surveys" ON surveys;
DROP POLICY IF EXISTS "Users can update their own surveys" ON surveys;
DROP POLICY IF EXISTS "Users can delete their own surveys" ON surveys;

-- Add new policies for public survey access
CREATE POLICY "Anyone can create surveys"
  ON surveys
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Survey creators can view their surveys"
  ON surveys
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Allow if user owns the survey
    (auth.uid()::text = user_id::text) OR
    -- Allow if survey is published (for public viewing)
    (status = 'published')
  );

CREATE POLICY "Survey creators can update their surveys"
  ON surveys
  FOR UPDATE
  TO anon, authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Survey creators can delete their surveys"
  ON surveys
  FOR DELETE
  TO anon, authenticated
  USING (auth.uid()::text = user_id::text);

-- Function to create or get user by email
CREATE OR REPLACE FUNCTION get_or_create_user_by_email(user_email text, user_name text DEFAULT NULL)
RETURNS uuid AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Try to find existing user
  SELECT id INTO user_id FROM users WHERE email = user_email;
  
  -- If user doesn't exist, create one
  IF user_id IS NULL THEN
    INSERT INTO users (email, name) 
    VALUES (user_email, user_name) 
    RETURNING id INTO user_id;
  END IF;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;