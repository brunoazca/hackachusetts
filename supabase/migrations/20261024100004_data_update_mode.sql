-- How fresh each source is, so the UI and the agent can say "live", "daily" or "static" per layer.
--   live   : pulled by the Refresh button (Modal `refresh`, ~15 s) and the daily cron
--   daily  : pulled by the daily cron only (10:00 UTC)
--   static : loaded once (snapshot or closed historical year); re-run by hand with a backfill
alter table sources add column if not exists update_mode text not null default 'static'
  check (update_mode in ('live', 'daily', 'static'));
alter table sources add column if not exists update_note text;
