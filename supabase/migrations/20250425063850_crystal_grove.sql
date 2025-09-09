/*
  # Initial database schema for NPS Survey Application

  1. New Tables
    - `surveys` - Stores survey metadata and settings
    - `survey_responses` - Stores individual NPS responses
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for querying survey data
*/

-- Create surveys table
CREATE TABLE IF NOT EXISTS surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'published')),
  settings jsonb,
  responses integer DEFAULT 0,
  score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create survey responses table
CREATE TABLE IF NOT EXISTS survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 0 AND score <= 10),
  feedback text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Policies for surveys table
CREATE POLICY "Users can create their own surveys"
  ON surveys
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own surveys"
  ON surveys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own surveys"
  ON surveys
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own surveys"
  ON surveys
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Anyone can view published surveys (for the survey page)
CREATE POLICY "Anyone can view published surveys"
  ON surveys
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Policies for survey_responses table
CREATE POLICY "Anyone can insert survey responses"
  ON survey_responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view responses for their surveys"
  ON survey_responses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM surveys
      WHERE surveys.id = survey_responses.survey_id
      AND surveys.user_id = auth.uid()
    )
  );

-- Function to update survey stats when a new response is added
CREATE OR REPLACE FUNCTION update_survey_stats(survey_id uuid, new_score integer)
RETURNS void AS $$
DECLARE
  current_responses integer;
  current_score integer;
  total_responses integer;
  promoters integer;
  detractors integer;
  nps_score integer;
BEGIN
  -- Get current stats
  SELECT responses, score INTO current_responses, current_score
  FROM surveys
  WHERE id = survey_id;
  
  -- Increment response count
  UPDATE surveys
  SET responses = COALESCE(current_responses, 0) + 1
  WHERE id = survey_id;
  
  -- Calculate new NPS score
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE score >= 9) as promoters_count,
    COUNT(*) FILTER (WHERE score <= 6) as detractors_count
  INTO total_responses, promoters, detractors
  FROM survey_responses
  WHERE survey_id = survey_id;
  
  -- Calculate NPS score: (% Promoters - % Detractors) * 100
  IF total_responses > 0 THEN
    nps_score := ROUND(((promoters::float / total_responses) - (detractors::float / total_responses)) * 100);
    
    UPDATE surveys
    SET score = nps_score
    WHERE id = survey_id;
  END IF;
END;
$$ LANGUAGE plpgsql;