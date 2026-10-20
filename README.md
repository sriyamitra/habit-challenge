# Daily Stack: group habit challenges

A mobile web app for friend groups doing habit challenges. Everyone checks in with a photo for each habit every day, the photos go into a group chat, and anyone who misses a day loses the wager.

- **App:** React and Vite, hosted free on **Vercel**
- **Data:** **Supabase** (free tier), which handles sign-in, the database, photo storage and live chat

People open the link on their phone and can tap "Add to Home Screen" so it works like an app.

---

## 1. Set up Supabase (about 5 minutes)

1. Go to https://supabase.com, sign up, and click **New project**. Pick any name and region, and save the database password somewhere.
2. When the project is ready, open **SQL Editor**, then **New query**. Paste the whole of `supabase/schema.sql` and click **Run**. You should see "Success".
3. Open **Project Settings**, then **API**, and copy two values:
   - **Project URL**
   - **anon public** key (it's safe to use in the browser because the security rules protect the data)
4. Open **Authentication**, then **URL Configuration**:
   - **Site URL:** put `http://localhost:5173` for now. After step 3 you'll change it to your Vercel address.
   - **Redirect URLs:** add `http://localhost:5173/**`. Later, also add `https://YOUR-APP.vercel.app/**`.

Sign-in uses email links, so there are no passwords. Supabase's built-in email sender is fine for testing but only sends a few emails per hour. When real friends start using the app, connect a free email service under Authentication, then Emails, then SMTP. Resend works well for this.

## 2. Run it on your Mac (optional)

You need Node.js 18 or newer from https://nodejs.org.

```bash
cd ~/code/habit-challenge
cp .env.example .env.local     # then paste your URL and anon key into .env.local
npm install
npm run dev                    # opens http://localhost:5173
```

## 3. Put it online with GitHub and Vercel

1. Create a new **empty** repository on GitHub called `habit-challenge`, then push the code:
   ```bash
   cd ~/code/habit-challenge
   git init && git add . && git commit -m "Daily Stack app"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/habit-challenge.git
   git push -u origin main
   ```
2. Go to https://vercel.com, sign in with GitHub, click **Add New**, then **Project**, and import `habit-challenge`.
3. Before you click Deploy, open **Environment Variables** and add:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
4. Click **Deploy**. You'll get an address like `https://habit-challenge-xyz.vercel.app`.
5. Back in Supabase, under **Authentication**, then **URL Configuration**, set **Site URL** to that address and add `https://habit-challenge-xyz.vercel.app/**` to Redirect URLs.

From now on, every `git push` updates the live app automatically.

## How it works

| Screen | What it does |
| --- | --- |
| Challenge | Today's habits as colour blobs (bright when done), day progress ticks, streak, checklist |
| Check-in | Take or upload a photo for each habit. Photos are shrunk before upload and can be posted to the chat |
| Chat | Live group chat with today's photo wall, photo check-ins, cheers, and the option to post a photo as a check-in |
| Friends | Invite code and share link, plus everyone's 20-day progress |
| Wager | Rules, stake, standings, and the final result once the last day passes |

- A day counts only when **every** habit has a photo check-in that day, using each person's own phone date.
- Only members of a challenge can see its challenge data, chat and photos. This is enforced by Supabase row-level security in `schema.sql`.
- Photos are stored in a private Supabase Storage bucket called `photos` and shown through links that expire.

## Free-tier limits worth knowing

- Supabase free tier: 500 MB database, 1 GB file storage, and the project pauses after a week with no activity. Opening it again in the dashboard wakes it up. Photos are compressed to about 200 KB each, so 1 GB holds roughly 5,000 check-ins.
- Vercel Hobby plan: free for personal, non-commercial projects.

## Project layout

```
supabase/schema.sql   database tables, security rules, photo bucket, realtime
src/pages/            Login, Onboarding, Home, NewChallenge, Join, Today, Checkin, Chat, Friends, Wager
src/components/       Aura blobs, tick marks, tab bar, photo loader, icons
src/lib/              dates, progress maths, photo upload/compression, check-in helper
src/styles.css        the whole Aura theme (colours, type, layout)
```
