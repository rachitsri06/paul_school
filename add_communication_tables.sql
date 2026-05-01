CREATE TABLE IF NOT EXISTS public.communications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL,
    title text,
    message text NOT NULL,
    sender text DEFAULT 'Admin',
    recipients text NOT NULL,
    status text DEFAULT 'Sent',
    sent_count integer DEFAULT 0,
    failed_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notification_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    type text NOT NULL,
    message text NOT NULL,
    recipient_group text,
    sent integer DEFAULT 0,
    failed integer DEFAULT 0,
    total integer DEFAULT 0,
    sent_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

NOTIFY pgrst, 'reload schema';
