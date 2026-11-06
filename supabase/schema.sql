create table if not exists public.registrations (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    email text not null,
    phone text not null,
    school_origin text not null default 'SMAN 1 SLAWI',
    category text default 'Fun Run',
    created_at timestamptz default now() not null
);

create table if not exists public.payments (
    id uuid primary key default gen_random_uuid(),
    registration_id uuid not null references public.registrations(id) on delete cascade,
    amount integer not null,
    unique_code integer,
    method text not null default 'QRIS' check (method in ('QRIS', 'Dana', 'GoPay')),
    status text not null default 'pending' check (status in ('pending', 'waiting_verification', 'paid', 'rejected', 'expired')),
    expires_at timestamptz not null,
    paid_at timestamptz,
    payment_code text not null unique,
    proof_image text,
    sender_name text,
    rejection_reason text,
    created_at timestamptz default now() not null
);

create table if not exists public.wa_invite_links (
    id uuid primary key default gen_random_uuid(),
    registration_id uuid not null references public.registrations(id) on delete cascade,
    token text not null unique,
    wa_group_url text not null,
    used boolean not null default false,
    used_at timestamptz,
    created_at timestamptz default now() not null
);

create index if not exists registrations_email_idx on public.registrations (email);
create index if not exists payments_registration_id_idx on public.payments (registration_id);
create index if not exists payments_payment_code_idx on public.payments (payment_code);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_expires_at_idx on public.payments (expires_at);
create index if not exists wa_invite_links_token_idx on public.wa_invite_links (token);
create index if not exists wa_invite_links_registration_id_idx on public.wa_invite_links (registration_id);

alter table public.registrations enable row level security;
alter table public.payments enable row level security;
alter table public.wa_invite_links enable row level security;

alter table public.registrations force row level security;
alter table public.payments force row level security;
alter table public.wa_invite_links force row level security;

create policy "Allow anonymous registration submission"
    on public.registrations
    for insert
    to anon, authenticated
    with check (true);

create policy "Allow participant lookup by id"
    on public.registrations
    for select
    to anon, authenticated
    using (true);

create policy "Allow payment insert"
    on public.payments
    for insert
    to anon, authenticated
    with check (true);

create policy "Allow payment select"
    on public.payments
    for select
    to anon, authenticated
    using (true);

create policy "Allow payment status update"
    on public.payments
    for update
    to anon, authenticated
    using (true)
    with check (true);

create policy "Allow wa invite link insert"
    on public.wa_invite_links
    for insert
    to anon, authenticated
    with check (true);

create policy "Allow wa invite link lookup by token"
    on public.wa_invite_links
    for select
    to anon, authenticated
    using (true);

create policy "Allow wa invite link update"
    on public.wa_invite_links
    for update
    to anon, authenticated
    using (true)
    with check (true);
