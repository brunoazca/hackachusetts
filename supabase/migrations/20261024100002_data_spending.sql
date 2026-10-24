-- City pest-control spending from Checkbook Explorer, per fiscal year x department x vendor.
-- Vendors are companies (public record). Lower bound: matched on vendor name only.
create table if not exists spending (
  id          text primary key,              -- 'fy2026:<dept>:<vendor>' slug
  source_id   text not null references sources(id),
  fiscal_year int not null,
  department  text,
  vendor      text,
  amount      numeric not null,
  n_payments  int not null
);
create index if not exists spending_fy_idx on spending (fiscal_year);
alter table spending enable row level security;
drop policy if exists "public read" on spending;
create policy "public read" on spending for select using (true);
