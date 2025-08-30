-- Agrega un campo de progreso a la tabla jobs
ALTER TABLE public.jobs ADD COLUMN progress integer DEFAULT 0;
