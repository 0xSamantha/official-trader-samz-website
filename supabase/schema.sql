-- Run in the NEW personal-website project, not the DBD project.
begin;
create table if not exists public.site_hello (
 id integer primary key check (id = 1),
 total bigint not null default 0 check (total between 0 and 9007199254740991),
 bucket bigint not null default 0,
 hits integer not null default 0
);
insert into public.site_hello (id) values (1) on conflict do nothing;
alter table public.site_hello enable row level security;
revoke all on public.site_hello from public, anon, authenticated;
grant select, update on public.site_hello to service_role;

create or replace function public.site_say_hi()
returns bigint language plpgsql security invoker set search_path = '' as $$
declare
 current_bucket bigint := floor(extract(epoch from clock_timestamp()) / 60);
 row public.site_hello%rowtype;
 result bigint;
begin
 select * into strict row from public.site_hello where id = 1 for update;
 -- Shared ceiling bounds automated writes without relying on spoofable IP headers.
 if row.bucket = current_bucket and row.hits >= 300 then return -1; end if;
 update public.site_hello set total = total + 1,
 hits = case when bucket = current_bucket then hits + 1 else 1 end,
 bucket = current_bucket where id = 1 returning total into result;
 return result;
end;
$$;
revoke all on function public.site_say_hi() from public, anon, authenticated;
grant execute on function public.site_say_hi() to service_role;
commit;
