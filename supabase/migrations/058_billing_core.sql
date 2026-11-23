create table billing_customers (
  subject_type        text not null check (subject_type in ('user','org')),
  subject_id          uuid not null,
  stripe_customer_id  text not null unique,
  created_at          timestamptz not null default now(),
  primary key (subject_type, subject_id)
);

create table billing_grants (
  id            uuid primary key default gen_random_uuid(),
  subject_type  text not null check (subject_type in ('user','org')),
  subject_id    uuid not null,
  feature       text not null,
  source        text not null,   -- stripe_subscription | stripe_payment | manual
  source_ref    text not null,   -- entitlement id, checkout session id, or note
  granted_at    timestamptz not null default now(),
  expires_at    timestamptz,     -- null = no expiry
  revoked_at    timestamptz,
  unique (subject_type, subject_id, feature, source, source_ref)
);

create index billing_grants_lookup
  on billing_grants (subject_type, subject_id, feature)
  where revoked_at is null;

create table billing_events (
  event_id      text primary key,   -- Stripe event id, for idempotency
  type          text not null,
  received_at   timestamptz not null default now(),
  processed_at  timestamptz,
  outcome       text                -- applied | ignored | failed
);

alter table billing_customers enable row level security;
alter table billing_grants    enable row level security;
alter table billing_events    enable row level security;

-- Users may read their own grants. All writes go through the service role.
create policy grants_read_own on billing_grants
  for select using (subject_type = 'user' and subject_id = auth.uid());
