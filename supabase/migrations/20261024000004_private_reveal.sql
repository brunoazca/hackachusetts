-- Names and full addresses are public records, but they stay OUT of the public API.
-- They live in a schema PostgREST does not expose; the UI shows them blurred and
-- fetches them only when the user clicks the eye icon (Vercel /api/reveal, service role).
create schema if not exists private;
revoke all on schema private from anon, authenticated;

create table if not exists private.parcel_owners (
  pid            text primary key,
  owner          text,
  mail_address   text,
  full_address   text,
  source_id      text not null
);

create table if not exists private.incident_details (
  incident_id    text primary key,
  full_address   text,
  closure_note_raw text,          -- unscrubbed note (may contain staff names)
  source_id      text not null
);

-- Every reveal is logged (who/when/what), shown in the demo as accountability.
create table if not exists private.reveal_log (
  id          bigserial primary key,
  kind        text not null,        -- owner | address | note
  ref_id      text not null,
  revealed_at timestamptz not null default now(),
  client      text
);
