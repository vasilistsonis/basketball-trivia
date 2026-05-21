# Basketball Trivia

A basketball trivia app with a React/Vite frontend and an Express API backed by Supabase.

## Run Locally

```bash
npm install
npm run dev
```

Open the frontend URL printed by Vite, usually:

```txt
http://localhost:5173
```

The API runs on:

```txt
http://localhost:3001
```

## Supabase Database

The app reads questions from Supabase through the Express API. React calls local `/api` endpoints, and the server talks to Supabase.

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run the SQL in `supabase/schema.sql`.
4. Copy `.env.example` to `.env`.
5. Fill in your project URL, anon key, and service role key.
6. Seed the online database:

```bash
npm run seed
```

To check that the API and database are connected:

```txt
http://localhost:3001/api/health
```

Do not commit `.env`. The service role key can write to your database and must stay private.
