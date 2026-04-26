CREATE TABLE IF NOT EXISTS public.transport_routes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    route_name text NOT NULL,
    bus_number text,
    driver text,
    driver_phone text,
    students_count integer DEFAULT 0,
    stops text[] DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Force cache reload to prevent "relation does not exist" API errors
NOTIFY pgrst, 'reload schema';
