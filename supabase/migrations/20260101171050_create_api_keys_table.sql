/*
  # Add API Keys Table

  1. New Tables
    - `api_keys`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `key_value` (text, unique)
      - `name` (text, optional name for the key)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `last_used_at` (timestamp, nullable)

  2. Security
    - Enable RLS on `api_keys` table
    - Add policy for users to manage their own API keys

  3. Functions
    - Function to generate API key for user
    - Function to validate API key
*/

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_value text UNIQUE NOT NULL,
  name text DEFAULT 'Default API Key',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
  ON api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
  ON api_keys
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
  ON api_keys
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION get_or_create_api_key(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_key text;
  new_key text;
BEGIN
  SELECT key_value INTO existing_key
  FROM api_keys
  WHERE user_id = p_user_id AND is_active = true
  LIMIT 1;
  
  IF existing_key IS NOT NULL THEN
    RETURN existing_key;
  END IF;
  
  new_key := 'nps_' || encode(gen_random_bytes(20), 'hex');
  
  INSERT INTO api_keys (user_id, key_value, name)
  VALUES (p_user_id, new_key, 'Default API Key');
  
  RETURN new_key;
END;
$$;

CREATE OR REPLACE FUNCTION validate_api_key(p_key_value text)
RETURNS TABLE(user_id uuid, email text, is_valid boolean)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE api_keys 
  SET last_used_at = now() 
  WHERE key_value = p_key_value AND is_active = true;
  
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email::text as email,
    true as is_valid
  FROM api_keys ak
  JOIN auth.users u ON ak.user_id = u.id
  WHERE ak.key_value = p_key_value AND ak.is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT null::uuid, null::text, false;
  END IF;
END;
$$;