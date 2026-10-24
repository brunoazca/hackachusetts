import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyError } from "../data/supabase";

test("PostgREST errors are classified", () => {
  assert.equal(classifyError({ code: "42501", message: "permission denied for table sites" }), "permission");
  assert.equal(classifyError({ code: "PGRST301", message: "JWT expired" }), "permission");
  assert.equal(classifyError({ code: "PGRST205", message: "Could not find the table 'public.foo' in the schema cache" }), "missing_table");
  assert.equal(classifyError({ code: "42P01", message: 'relation "foo" does not exist' }), "missing_table");
  assert.equal(classifyError({ code: "", message: "TypeError: fetch failed" }), "connection");
  assert.equal(classifyError({ code: "22P02", message: "invalid input syntax" }), "query");
});
