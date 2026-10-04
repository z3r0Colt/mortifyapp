# Mortify Brethren System Prompts

Run these after the core prompts are finished and the PWA is live.

Paste one part at a time in a fresh Agent chat. Test each part before moving on.

---

## The Vision (paste this at the top of every Brethren part)

Mortify has a brethren system. It is a small, closed circle of believers who pray for one another and watch over one another, following James 5:16 and Galatians 6:1 and 2. It is not a social network. There is no public feed, no search for strangers, no likes, no follower counts, and no images or links in messages.

Every user has a profile. Brethren find each other only by sharing a private code in person or by text. Each man chooses exactly what his brethren may see.

Brethren link only with the same sex. Men link with brothers. Women link with sisters. The UI says "brethren" for men and "sisters" for women.

A circle holds at most 8 people so it stays close and real. The app should gently encourage linking with believers from his own local church.

All messages are short and purposeful. The heart of it is one tap prayer. Free text replies exist but are capped at 500 characters.

---

## Brethren Part A Backend

Set up the Supabase backend for the brethren system. Write the SQL migration file and row level security policies for these tables.

`profiles` holds id (matches auth user), display name, sex (brother or sister), optional church name, a unique 6 character brethren code, and created date.

`brethren_links` holds requester id, receiver id, status (pending, accepted, removed), and dates. A link counts only when both sides accept.

`shared_settings` holds each user's sharing choices. Share battles (on or off). Share temptations (on or off). Share falls (on or off). Share blocker status (on or off). All default to on except falls, which default to off.

`shared_events` holds user id, event type (temptation, fall, stood_firm, blocker_off, blocker_on), battle id, and timestamp. No free text. No journal content ever.

`messages` holds sender id, receiver id, message type (pray_for_me, praying, checking_in, reply, encouragement), optional body capped at 500 characters, optional parent message id, read flag, and timestamp.

`push_subscriptions` holds user id, platform (web, android, ios), and the push subscription or token.

Row level security must make sure a user can only read profiles, events, and messages of people he has an accepted link with, and only events his brethren chose to share. No one can read anyone else's data otherwise.

Write a Supabase Edge Function that sends a Web Push notification (using VAPID keys) when a new row lands in `messages`. A pray_for_me message must use high urgency so it arrives right away. Build it so native push through Firebase Cloud Messaging can be added later for platform android and ios.

Write a second Edge Function on a Supabase cron schedule that sends each user his morning reading and evening examination reminders at the times he picked, using his time zone.

Add Supabase email sign in to the app and push subscription in the service worker. On iPhone, explain in the UI that push only works after adding Mortify to the home screen. Explain every setup step I need to do in the Supabase dashboard.

---

## Brethren Part B Profile and Adding Brethren

Add a Brethren tab to the bottom tab bar. Build a profile setup screen that appears the first time he opens it. He enters a display name, picks brother or sister, and optionally adds his church.

Build the Brethren tab. At the top, show his own 6 character code in large serif type with a share button that sends the code by text. Below it, an "Add by code" button opens a field to type a code.

When he enters a code, show the other person's display name and church and ask him to confirm. The other person then gets a request he can accept or decline. Block links between different sexes. Block adding past 8 brethren.

List his accepted brethren as simple quiet cards with name and church. Tapping a card opens that brother's profile. Long press offers "Remove from my brethren," which removes the link quietly without notifying the other side.

Build a sharing settings screen with the four on and off switches from `shared_settings`. Each switch has one plain sentence explaining what his brethren will see.

---

## Brethren Part C Messages

Build in-app messaging with these message types.

**Please pray for me** is sent to every brother in his circle at once. It includes the battle he is fighting if he shares battles. It never includes any detail beyond that.

**I'm praying for you** is a one tap reply to a prayer request. The sender sees a gentle count of how many brethren are praying for him.

**Checking in** is sent to one brother. It asks "How is your soul today?"

**Reply** is a short free text answer up to 500 characters, threaded under the message it answers.

**Encouragement** is a short free text message to one brother, also capped at 500 characters.

Messages allow plain text only. Strip any links. No images, files, or voice notes.

Build a Messages screen grouped by brother, newest first. Prayer requests show in a calm highlighted card at the top until 24 hours pass or he marks them answered. Unread messages show a small brass dot.

Push notifications use plain wording. "Brother Name asks you to pray for him." "Brother Name is praying for you." Add a discreet notifications setting that makes them say only "New message" with no names.

Use Supabase Realtime so new messages appear right away while the app is open.

---

## Brethren Part D Shared Profiles

Build the brother profile screen that opens from his card. It shows only what that brother chose to share.

Show his battles as simple text tags. Show a quiet timeline of shared events from the past 30 days in plain words, such as "Tempted, Tuesday evening, Lust" or "Stood firm, Wednesday." Show a fall only if he shares falls, worded gently as "Fell and confessed" with no red and no icons of failure. Show a small note if his blocker is off.

At the bottom of each profile, place three buttons. Pray for him (sends a praying message). Check in. Send encouragement.

In the user's own Brethren tab, add a "What my brethren see" button that shows his own profile exactly as his brethren see it.

---

## Brethren Part E Wire It Into the App

Replace the placeholder step in the flee sequence with one large button that says "Ask my brethren to pray." It sends a pray_for_me message to the whole circle in one tap. Keep a small secondary "Call a brother" button that opens a list of brethren who added a phone number and uses a `tel:` link. If he is offline, queue the request and send it the moment he reconnects.

When he answers "Yes, by God's grace" at the end of the flee sequence, log a stood_firm event.

Every flee use logs a temptation event if he shares temptations.

In the after a fall flow, replace the placeholder step with "Tell my brethren." It logs a fall event only if he chose to share falls, and it offers an optional short message to his circle. Remind him in one plain sentence that confession to a brother is good for the soul (James 5:16).

On the protection setup screen, when he checks or unchecks "My protection is set up," log a blocker_on or blocker_off event so his brethren see it if he shares blocker status.

Show the number of unread messages as a small dot on the Brethren tab.

---

## Brethren Part F Safety and Cleanup

Add a "Delete my account" option in settings that removes his profile, links, events, messages, and push subscriptions from Supabase for good.

Add a way to report a message as abusive, which removes the link and hides that person's messages.

If he signs out or has no internet, every other feature in Mortify keeps working offline.

Go through every brethren screen and check it against AGENTS.md for colors, fonts, wording, and dark mode.
