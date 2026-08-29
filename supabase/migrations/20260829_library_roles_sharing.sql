-- Onyx Client Portal — document library, sharing roles, acknowledgment flag.
--
-- Run this in the Supabase SQL editor. It is written to be re-runnable.
--
-- Canonical doc_type values the library expects (spelling is load-bearing):
--   Written Information Security Plan
--   Vendor Security Overview
--   Incident Response Plan
--   Risk Register
--   Remediation Roadmap
--   Compliance Gap Analysis
-- The app also accepts the legacy short forms ('WISP', 'IR Plan', …) and
-- renders the canonical name, so existing rows keep working untouched.

/* ---------------------------------------------------------------- columns */

-- The named vCISO shown in the portal menu. Left null hides that menu item.
alter table public.clients
  add column if not exists vciso_name text,
  add column if not exists vciso_contact text;

-- Two roles gate the Share control. Everyone else reads documents normally.
alter table public.client_users
  add column if not exists role text not null default 'member';

alter table public.client_users
  drop constraint if exists client_users_role_check;
alter table public.client_users
  add constraint client_users_role_check
  check (role in ('member', 'primary_contact', 'approval_authority'));

-- One flag, set by Onyx staff. Never a count, never per-employee tracking.
-- Drives both the library detail row and the Insurance Readiness checklist.
alter table public.documents
  add column if not exists all_employees_acknowledged boolean not null default false;

-- Object key in the private 'documents' storage bucket, as '<client_id>/<file>.pdf'.
-- The storage policy below reads the client_id back out of that first segment.
alter table public.documents
  add column if not exists storage_path text;

/* -------------------------------------------------------------- functions */

-- security definer so a policy can consult client_users without tripping
-- that table's own RLS. search_path is pinned per Supabase guidance.
create or replace function public.is_client_member(target_client uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.client_users
    where auth_user_id = auth.uid() and client_id = target_client
  );
$$;

create or replace function public.can_share(target_client uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.client_users
    where auth_user_id = auth.uid()
      and client_id = target_client
      and role in ('primary_contact', 'approval_authority')
  );
$$;

/* ----------------------------------------------------------- share links */

create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  -- The unguessable half of the recipient URL: /share/<token>.
  token text not null unique,
  audience text not null check (audience in ('insurer_broker', 'examiner_auditor')),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  revoked boolean not null default false
);

create index if not exists share_links_client_id_idx on public.share_links (client_id);

-- Every open of a share link, with a timestamp. Written by the recipient page,
-- which Phase 3 builds; the table exists now so no access goes unrecorded.
create table if not exists public.share_link_access (
  id uuid primary key default gen_random_uuid(),
  share_link_id uuid not null references public.share_links(id) on delete cascade,
  accessed_at timestamptz not null default now()
);

create index if not exists share_link_access_link_idx
  on public.share_link_access (share_link_id, accessed_at desc);

alter table public.share_links enable row level security;
alter table public.share_link_access enable row level security;

-- Anyone at the firm may see the firm's links; only the two roles may create
-- them. Hiding the button in the UI is not the control — this is.
drop policy if exists "share_links readable by client" on public.share_links;
create policy "share_links readable by client" on public.share_links
  for select to authenticated
  using (public.is_client_member(client_id));

drop policy if exists "share_links created by sharing roles" on public.share_links;
create policy "share_links created by sharing roles" on public.share_links
  for insert to authenticated
  with check (public.can_share(client_id) and created_by = auth.uid());

drop policy if exists "share_links revocable by sharing roles" on public.share_links;
create policy "share_links revocable by sharing roles" on public.share_links
  for update to authenticated
  using (public.can_share(client_id))
  with check (public.can_share(client_id));

-- Revoke is the only edit a client can make: withhold update on every other
-- column so a rewritten expiry or audience can't ride in on the same policy.
revoke update on public.share_links from authenticated;
grant update (revoked) on public.share_links to authenticated;

drop policy if exists "share_link_access readable by client" on public.share_link_access;
create policy "share_link_access readable by client" on public.share_link_access
  for select to authenticated
  using (exists (
    select 1 from public.share_links link
    where link.id = share_link_id and public.is_client_member(link.client_id)
  ));

-- No anon policy yet, deliberately: the recipient-facing page is designed
-- separately (Section 2.8). It will add its own token-scoped anon access.

/* -------------------------------------------------------------- storage */

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "clients read their own documents" on storage.objects;
create policy "clients read their own documents" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and public.is_client_member(((storage.foldername(name))[1])::uuid)
  );
