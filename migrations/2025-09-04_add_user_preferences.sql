-- Add user preference columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'es',
ADD COLUMN IF NOT EXISTS default_summary_style VARCHAR(20) DEFAULT 'ejecutivo';

-- Update existing users to have default values
UPDATE public.profiles 
SET language = 'es', default_summary_style = 'ejecutivo' 
WHERE language IS NULL OR default_summary_style IS NULL;
