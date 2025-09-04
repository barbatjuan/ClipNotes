-- Script para actualizar nomenclatura de planes: basic -> starter
-- Ejecutar en Supabase SQL Editor

-- 1. Actualizar todos los usuarios que tienen plan 'basic' a 'starter'
UPDATE profiles 
SET plan_tier = 'starter' 
WHERE plan_tier = 'basic';

-- 2. Verificar los cambios
SELECT plan_tier, COUNT(*) as count
FROM profiles 
GROUP BY plan_tier
ORDER BY plan_tier;

-- 3. Opcional: Ver todos los usuarios con sus nuevos planes
SELECT user_id, plan_tier, monthly_minutes_limit, created_at
FROM profiles 
ORDER BY plan_tier, created_at DESC;
