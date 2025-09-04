-- Fix existing free plan users to have correct monthly_minutes_limit
-- This updates all users with plan_tier 'free' to have 10 minutes limit

UPDATE profiles 
SET monthly_minutes_limit = 10, 
    updated_at = now()
WHERE plan_tier = 'free' 
  AND monthly_minutes_limit != 10;

-- Fix specific user with basic plan to have 60 minutes
UPDATE profiles 
SET monthly_minutes_limit = 60, 
    updated_at = now()
WHERE user_id = 'b4879d6f-acd1-466e-aa64-8e6e5d63b372' 
  AND plan_tier = 'basic';

-- Also fix any other users with plan_tier 'basic' to ensure they have 60 minutes
UPDATE profiles 
SET monthly_minutes_limit = 60, 
    updated_at = now()
WHERE plan_tier = 'basic' 
  AND monthly_minutes_limit != 60;

-- Fix any users with plan_tier 'pro' to ensure they have 300 minutes  
UPDATE profiles 
SET monthly_minutes_limit = 300, 
    updated_at = now()
WHERE plan_tier = 'pro' 
  AND monthly_minutes_limit != 300;

-- Show the updated records
SELECT user_id, plan_tier, monthly_minutes_limit, updated_at 
FROM profiles 
WHERE plan_tier IN ('free', 'basic', 'pro')
ORDER BY plan_tier, updated_at DESC;
