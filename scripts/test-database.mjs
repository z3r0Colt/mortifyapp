import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import assert from "node:assert/strict";
const db = new PGlite();
await db.exec(
  `create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`,
);
// Match Supabase: new public tables and functions are granted to every API role
// unless a migration revokes them.
await db.exec(
  `grant usage on schema public to anon,authenticated; alter default privileges in schema public grant all on tables to anon,authenticated,service_role; alter default privileges in schema public grant all on functions to anon,authenticated,service_role;`,
);
for (const file of (await readdir("supabase/migrations")).sort())
  await db.exec(await readFile(`supabase/migrations/${file}`, "utf8"));
const ids = Array.from(
  { length: 12 },
  (_, i) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
);
for (const id of ids)
  await db.query("insert into auth.users(id) values($1)", [id]);
async function asUser(id) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("set role authenticated");
}
const profiles = [];
for (let i = 0; i < ids.length; i++) {
  await asUser(ids[i]);
  profiles.push(
    (
      await db.query(
        "select * from public.create_profile($1,$2,'Local church')",
        [`Person ${i + 1}`, i === 2 ? "sister" : "brother"],
      )
    ).rows[0],
  );
}
await asUser(ids[0]);
assert.equal(
  (await db.query("select * from profiles")).rows.length,
  1,
  "unrelated profiles stay private",
);
assert.equal(
  (
    await db.query("select public.request_link($1) id", [
      profiles[2].brethren_code,
    ])
  ).rows[0].id,
  null,
  "the other sex looks like no code at all",
);
const request = (
  await db.query("select public.request_link($1) id", [
    profiles[1].brethren_code,
  ])
).rows[0].id;
assert.equal(
  (await db.query("select * from profiles")).rows.length,
  1,
  "pending links do not expose profiles",
);
await assert.rejects(
  db.query("select public.respond_link($1,true)", [request]),
  /unavailable/,
);
assert.deepEqual(
  (await db.query("select link_id,display_name from sent_requests()")).rows,
  [{ link_id: request, display_name: "Person 2" }],
  "the one who asks sees the request waiting",
);
await asUser(ids[1]);
assert.equal(
  (await db.query("select * from sent_requests()")).rows.length,
  0,
  "the one asked does not see it as sent",
);
await db.query("select public.withdraw_request($1)", [request]);
await asUser(ids[0]);
assert.equal(
  (await db.query("select * from sent_requests()")).rows.length,
  1,
  "only the one who asked can withdraw",
);
await db.query("select public.withdraw_request($1)", [request]);
assert.equal((await db.query("select * from sent_requests()")).rows.length, 0);
await db.query("select public.request_link($1)", [profiles[1].brethren_code]);
await asUser(ids[1]);
assert.equal(
  (await db.query("select * from pending_requests()")).rows.length,
  1,
);
await db.query("select public.respond_link($1,true)", [request]);
assert.equal(
  (await db.query("select * from profiles")).rows.length,
  2,
  "accepted peers can see profiles",
);
await db.query("select share_event('fall','lust')");
assert.equal(
  (await db.query("select * from shared_events")).rows.length,
  0,
  "falls default private",
);
await db.query("select share_event('temptation','lust')");
await asUser(ids[0]);
assert.equal(
  (await db.query("select * from shared_events")).rows[0].battle_id,
  "lust",
);
await asUser(ids[1]);
await db.query(
  "update shared_settings set share_battles=false where user_id=auth.uid()",
);
await asUser(ids[0]);
assert.equal(
  (await db.query("select * from shared_events")).rows[0].battle_id,
  null,
  "old battle IDs scrubbed",
);
await asUser(ids[1]);
await db.query(
  "update shared_settings set share_temptations=false where user_id=auth.uid()",
);
await asUser(ids[0]);
assert.equal(
  (await db.query("select * from shared_events")).rows.length,
  0,
  "sharing off revokes historical access",
);
await assert.rejects(
  db.query(
    "insert into brethren_links(requester_id,receiver_id,status) values($1,$2,'accepted')",
    [ids[0], ids[3]],
  ),
  /permission denied/,
);
await assert.rejects(
  db.query("update profiles set sex='sister' where id=auth.uid()"),
  /permission denied/,
);
await assert.rejects(
  db.query("select send_message($1,'encouragement','hello')", [ids[3]]),
  /accepted link/,
);
const msg = (
  await db.query("select send_message($1,'pray_for_me',null,null,'lust') id", [
    ids[1],
  ])
).rows[0].id;
await asUser(ids[1]);
const reply = (
  await db.query("select send_message($1,'praying',null,$2) id", [ids[0], msg])
).rows[0].id;
assert.equal(
  (
    await db.query("select send_message($1,'praying',null,$2) id", [
      ids[0],
      msg,
    ])
  ).rows[0].id,
  reply,
  "praying reply idempotent",
);
await db.query(
  "select send_message($1,'reply','Please check https://example.com today',$2)",
  [ids[0], msg],
);
assert.equal(
  (await db.query("select body from messages where message_type='reply'"))
    .rows[0].body,
  "Please check  today",
);
await assert.rejects(
  db.query("select send_message($1,'encouragement',$2)", [
    ids[0],
    "x".repeat(501),
  ]),
  /at most 500/,
);
await db.query("select mark_message_read($1)", [msg]);
assert.equal(
  (await db.query("select read from messages where id=$1", [msg])).rows[0].read,
  true,
);
await asUser(ids[2]);
assert.equal(
  (await db.query("select * from messages")).rows.length,
  0,
  "unrelated messages hidden",
);
await assert.rejects(
  db.query("select send_message($1,'reply','hello',$2)", [ids[0], msg]),
  /accepted link/,
);
for (let i = 3; i <= 9; i++) {
  await asUser(ids[0]);
  const link = (
    await db.query("select request_link($1) id", [profiles[i].brethren_code])
  ).rows[0].id;
  await asUser(ids[i]);
  await db.query("select respond_link($1,true)", [link]);
}
await asUser(ids[0]);
await assert.rejects(
  db.query("select request_link($1)", [profiles[10].brethren_code]),
  /at most 8/,
);
await db.query("select remove_link($1)", [ids[1]]);
assert.equal(
  (await db.query("select * from shared_events")).rows.length,
  0,
  "removed peers cannot see events",
);
await asUser(ids[3]);
await db.query(
  "insert into shared_battles(user_id,battle_ids) values(auth.uid(),array['lust'])",
);
await asUser(ids[0]);
assert.equal(
  (await db.query("select * from shared_battles where user_id=$1", [ids[3]]))
    .rows.length,
  1,
  "accepted battle choices visible",
);
await asUser(ids[3]);
await db.query(
  "update shared_settings set share_battles=false where user_id=auth.uid()",
);
await asUser(ids[0]);
assert.equal(
  (await db.query("select * from shared_battles where user_id=$1", [ids[3]]))
    .rows.length,
  0,
  "disabled battle choices hidden",
);
// Message limits: 30 an hour to one person, and a retry is not a new message.
const lastClient = "00000000-0000-4000-8000-000000000030";
for (let i = 1; i <= 30; i++)
  await db.query(
    "select send_message($1,'encouragement','Praying for you',null,null,$2)",
    [ids[4], `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`],
  );
await db.query(
  "select send_message($1,'encouragement','Praying for you',null,null,$2)",
  [ids[4], lastClient],
);
await assert.rejects(
  db.query("select send_message($1,'encouragement','One more')", [ids[4]]),
  /many messages this hour/,
  "hourly message limit to one person",
);
const reported = (
  await db.query(
    "select send_message($1,'encouragement','Please call me') id",
    [ids[3]],
  )
).rows[0].id;
await assert.rejects(
  db.query("select report_message($1)", [reported]),
  /Received message/,
  "sender cannot report own outgoing message",
);
await asUser(ids[3]);
await db.query("select report_message($1)", [reported]);
assert.equal(
  (await db.query("select * from messages where id=$1", [reported])).rows
    .length,
  0,
  "blocked message hidden",
);
assert.equal(
  (await db.query("select request_link($1) id", [profiles[0].brethren_code]))
    .rows[0].id,
  null,
  "reporter cannot relink",
);
await asUser(ids[0]);
assert.equal(
  (await db.query("select request_link($1) id", [profiles[3].brethren_code]))
    .rows[0].id,
  null,
  "reported peer cannot relink",
);
await assert.rejects(
  db.query("select * from private.message_reports"),
  /permission denied/,
  "reports private",
);
await db.exec("reset role");
await db.query("delete from auth.users where id=$1", [ids[3]]);
for (const table of [
  "profiles",
  "shared_settings",
  "shared_battles",
  "push_subscriptions",
])
  assert.equal(
    (
      await db.query(
        `select * from ${table} where ${table === "profiles" ? "id" : "user_id"}=$1`,
        [ids[3]],
      )
    ).rows.length,
    0,
    `${table} deletion cascades`,
  );
assert.equal(
  (
    await db.query(
      "select * from messages where sender_id=$1 or receiver_id=$1",
      [ids[3]],
    )
  ).rows.length,
  0,
  "messages deletion cascades",
);
// Private data: each user sees and writes only their own rows.
await asUser(ids[5]);
await db.query(
  "insert into user_preferences(onboarded,battles) values(true,'{lust}')",
);
await db.query(
  `insert into journals(id,battle,body) values(gen_random_uuid(),'lust','{"v":1,"iv":"a","data":"b"}')`,
);
await db.query(
  `insert into user_vault(key_id,recovery_salt,recovery_key) values(gen_random_uuid(),'salt2','{"v":1,"iv":"c","data":"d"}')`,
);
await db.query(`update user_vault set recovery_salt='salt3'`);
await assert.rejects(
  db.query(`update user_vault set key_id=gen_random_uuid()`),
  /permission denied/,
  "the key id is fixed once saved",
);
assert.deepEqual(
  (
    await db.query(
      "select column_name from information_schema.columns where table_name='user_vault' and column_name in ('salt','pin_key')",
    )
  ).rows,
  [],
  "the account holds no PIN-locked key",
);
await assert.rejects(
  db.query(`update user_vault set user_id=$1`, [ids[6]]),
  /permission denied/,
  "a PIN check cannot be moved to another account",
);
assert.equal(
  (await db.query("select public.rotate_reading('k',3,'2026-10-04') i")).rows[0]
    .i,
  0,
  "first reading starts at zero",
);
assert.equal(
  (await db.query("select public.rotate_reading('k',3,'2026-10-04') i")).rows[0]
    .i,
  0,
  "same day keeps the reading",
);
assert.equal(
  (await db.query("select public.rotate_reading('k',3,'2026-10-05') i")).rows[0]
    .i,
  1,
  "next day advances the reading",
);
await asUser(ids[6]);
for (const table of [
  "user_preferences",
  "journals",
  "user_vault",
  "reading_history",
])
  assert.equal(
    (await db.query(`select * from ${table}`)).rows.length,
    0,
    `${table} stays private`,
  );
await assert.rejects(
  db.query(
    `insert into journals(id,user_id,battle,body) values(gen_random_uuid(),$1,'lust','{}')`,
    [ids[5]],
  ),
  /row-level security/,
  "cannot write another user's journal",
);
await assert.rejects(
  db.query("update journals set battle='pride'"),
  /permission denied/,
  "journal entries cannot be edited",
);
// Safety before launch (202610080001).
assert.match(
  profiles[11].brethren_code,
  /^[A-Z2-9]{8}$/,
  "new codes are 8 characters",
);
// A report keeps its evidence when the reported person deletes his account,
// and the same message cannot be reported twice.
await asUser(ids[11]);
const evidenceLink = (
  await db.query("select request_link($1) id", [profiles[10].brethren_code])
).rows[0].id;
await asUser(ids[10]);
await db.query("select respond_link($1,true)", [evidenceLink]);
const abusive = (
  await db.query(
    "select send_message($1,'encouragement','You are worthless') id",
    [ids[11]],
  )
).rows[0].id;
await asUser(ids[11]);
for (let i = 0; i < 5; i++)
  await db.query("select report_message($1)", [abusive]);
await db.exec("reset role");
assert.equal(
  (
    await db.query(
      "select * from private.message_reports where message_id=$1",
      [abusive],
    )
  ).rows.length,
  1,
  "one report per message, however often it is reported",
);
await db.query("delete from auth.users where id=$1", [ids[10]]);
const kept = (
  await db.query("select * from private.message_reports where reporter_id=$1", [
    ids[11],
  ])
).rows;
assert.equal(kept.length, 1, "the report outlives the reported account");
assert.equal(
  kept[0].message_body,
  "You are worthless",
  "the reported message is kept",
);
assert.equal(kept[0].reported_name, "Person 11", "the sender's name is kept");
// Someone who only sends requests can be declined and blocked.
await asUser(ids[11]);
const unwanted = (
  await db.query("select request_link($1) id", [profiles[4].brethren_code])
).rows[0].id;
await asUser(ids[4]);
await db.query("select block_request($1)", [unwanted]);
await asUser(ids[11]);
assert.equal(
  (await db.query("select request_link($1) id", [profiles[4].brethren_code]))
    .rows[0].id,
  null,
  "a blocked requester cannot ask again",
);
// Names cannot carry web addresses.
await assert.rejects(
  db.query(
    "update profiles set display_name='Visit evil.example.com now' where id=auth.uid()",
  ),
  /check constraint/,
);
await assert.rejects(
  db.query(
    "update profiles set church_name='https://evil.example/x' where id=auth.uid()",
  ),
  /check constraint/,
);
await db.query(
  "update profiles set church_name='St. Paul''s Church' where id=auth.uid()",
);
// Wrong guesses are counted, so codes cannot be enumerated.
for (let i = 0; i < 25; i++)
  assert.equal(
    (
      await db.query("select request_link($1) id", [
        `ZZ${String(i).padStart(4, "2")}ZZ`,
      ])
    ).rows[0].id,
    null,
  );
assert.equal(
  (
    await db.query("select lookup_brethren($1) found", [
      profiles[1].brethren_code,
    ])
  ).rows[0].found,
  null,
  "after twenty guesses in an hour, even a real code is unavailable",
);
// Anyone can change their code; the old one stops working.
await asUser(ids[5]);
const oldCode = profiles[5].brethren_code;
const newCode = (await db.query("select rotate_brethren_code() code")).rows[0]
  .code;
assert.match(newCode, /^[A-Z2-9]{8}$/);
await asUser(ids[6]);
assert.equal(
  (await db.query("select lookup_brethren($1) found", [oldCode])).rows[0].found,
  null,
  "an old code stops working",
);
assert.equal(
  (await db.query("select lookup_brethren($1) found", [newCode])).rows[0].found
    .display_name,
  "Person 6",
);
// At most ten devices get notifications for one person.
await asUser(ids[6]);
for (let i = 0; i < 10; i++)
  await db.query(
    "insert into push_subscriptions(user_id,platform,device_id,subscription) values(auth.uid(),'web',gen_random_uuid(),'{\"endpoint\":\"https://fcm.googleapis.com/x\"}')",
  );
await assert.rejects(
  db.query(
    "insert into push_subscriptions(user_id,platform,device_id,subscription) values(auth.uid(),'web',gen_random_uuid(),'{}')",
  ),
  /many devices/,
);
const device = (
  await db.query("select device_id from push_subscriptions limit 1")
).rows[0].device_id;
await db.query(
  "insert into push_subscriptions(user_id,platform,device_id,subscription) values(auth.uid(),'web',$1,'{\"endpoint\":\"https://fcm.googleapis.com/y\"}') on conflict(user_id,device_id) do update set subscription=excluded.subscription",
  [device],
);
await db.query("delete from push_subscriptions where device_id=$1", [device]);
await assert.rejects(
  db.query(
    "insert into push_subscriptions(user_id,platform,device_id,subscription) values(auth.uid(),'web',gen_random_uuid(),$1)",
    [JSON.stringify({ endpoint: "x".repeat(5000) })],
  ),
  /check constraint/,
  "a subscription stays small",
);
await db.exec("reset role");
// Each person's own heart roots and occasions (202610090001).
await asUser(ids[7]);
await db.query(
  "insert into user_preferences(heart_roots,occasions) values(array['envy of others','weariness'],null)",
);
await assert.rejects(
  db.query("update user_preferences set heart_roots=array[repeat('x',41)]"),
  /check constraint/,
  "a heart root stays short",
);
await assert.rejects(
  db.query(
    "update user_preferences set occasions=array(select 'o' || g from generate_series(1,31) g)",
  ),
  /check constraint/,
  "the list stays short",
);
await assert.rejects(
  db.query("update user_preferences set heart_roots=array[E'a\\nb']"),
  /check constraint/,
  "no hidden characters",
);
await db.exec("reset role");
await db.exec("set role anon");
await assert.rejects(db.query("select * from profiles"), /permission denied/);
await assert.rejects(db.query("select * from journals"), /permission denied/);
await db.close();
console.log(
  "Database checks passed: profiles, links, same sex, code guessing, report evidence, request blocking, plain names, code rotation, device limits, editable heart roots, both-side acceptance, sharing revocation, capacity, mutation permissions, message limits, private data isolation, reading rotation, and anonymous access.",
);
