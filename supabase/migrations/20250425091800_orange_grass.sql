/*
  # Fix ambiguous column reference in update_survey_stats function

  1. Changes
    - Drop existing function to allow parameter name changes
    - Recreate function with unambiguous parameter names
    - Update function to use explicit table references
*/

-- Drop the existing function first
DROP FUNCTION IF EXISTS update_survey_stats(uuid, integer);

-- Recreate the function with the new parameter name
CREATE FUNCTION update_survey_stats(p_survey_id uuid, new_score integer)
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
  WHERE id = p_survey_id;
  
  -- Increment response count
  UPDATE surveys
  SET responses = COALESCE(current_responses, 0) + 1
  WHERE id = p_survey_id;
  
  -- Calculate new NPS score
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE score >= 9) as promoters_count,
    COUNT(*) FILTER (WHERE score <= 6) as detractors_count
  INTO total_responses, promoters, detractors
  FROM survey_responses
  WHERE survey_id = p_survey_id;
  
  -- Calculate NPS score: (% Promoters - % Detractors) * 100
  IF total_responses > 0 THEN
    nps_score := ROUND(((promoters::float / total_responses) - (detractors::float / total_responses)) * 100);
    
    UPDATE surveys
    SET score = nps_score
    WHERE id = p_survey_id;
  END IF;
END;
$$ LANGUAGE plpgsql;