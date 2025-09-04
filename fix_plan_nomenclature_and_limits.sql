-- Script para corregir nomenclatura de planes y límites
-- Ejecutar en Supabase SQL Editor

-- 1. Actualizar plan 'pro' a 'premium' (300 minutos)
UPDATE profiles 
SET plan_tier = 'premium',
    updated_at = now()
WHERE plan_tier = 'pro';

-- 2. Actualizar plan 'basic' a 'starter' (60 minutos) si existe
UPDATE profiles 
SET plan_tier = 'starter',
    monthly_minutes_limit = 60,
    updated_at = now()
WHERE plan_tier = 'basic';

-- 3. Asegurar límites correctos para todos los planes existentes
UPDATE profiles 
SET monthly_minutes_limit = 10,
    updated_at = now()
WHERE plan_tier = 'free' AND monthly_minutes_limit != 10;

UPDATE profiles 
SET monthly_minutes_limit = 60,
    updated_at = now()
WHERE plan_tier = 'starter' AND monthly_minutes_limit != 60;

UPDATE profiles 
SET monthly_minutes_limit = 300,
    updated_at = now()
WHERE plan_tier = 'premium' AND monthly_minutes_limit != 300;

UPDATE profiles 
SET monthly_minutes_limit = 600,
    updated_at = now()
WHERE plan_tier = 'enterprise' AND monthly_minutes_limit != 600;

-- 4. Para el plan FREE: cambiar a límite total en lugar de mensual
-- Agregar nueva columna para minutos totales procesados (no mensual)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_minutes_processed INTEGER DEFAULT 0;

-- Migrar datos existentes de free users
UPDATE profiles 
SET total_minutes_processed = COALESCE(minutes_processed_current_month, 0)
WHERE plan_tier = 'free';

-- 5. Verificar resultados
SELECT 
    plan_tier, 
    COUNT(*) as users_count,
    AVG(monthly_minutes_limit) as avg_limit,
    MAX(monthly_minutes_limit) as max_limit,
    MIN(monthly_minutes_limit) as min_limit
FROM profiles 
GROUP BY plan_tier
ORDER BY plan_tier;

-- 6. Ver usuarios específicos para verificación
SELECT 
    user_id, 
    plan_tier, 
    monthly_minutes_limit,
    minutes_processed_current_month,
    total_minutes_processed,
    paypal_subscription_id,
    updated_at
FROM profiles 
ORDER BY plan_tier, updated_at DESC;
