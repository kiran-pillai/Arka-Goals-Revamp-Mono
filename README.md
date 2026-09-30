# Arka: Action First Goal Tracker

An accountability and goal-tracking application built to help users structure, refine, and track their monthly and quarterly objectives.

## Features

* **AI SMART Goal Refiner:** Integrates Google's Gemini API (`gemini-3.8-flash`) to parse natural language intentions into structured SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound) directly during intake.
* **Interactive Squad Dashboard:** View personal and "Whole squad" goals via an interactive table. Click any goal to open a detailed modal overlaying the full SMART criteria breakdown.
* **Accountability Check-ins:** Relational tracking for weekly check-ins and specific action commitments.
* **Profile Management:** Custom user profiles allowing members to set personalized display names instead of defaulting to email addresses.
* **Secure Multi-Tenant Architecture:** Powered by Supabase PostgreSQL with strict Row Level Security (RLS) policies enforcing read/write boundaries between users.

## Tech Stack

* **Frontend:** React, Vite, TypeScript
* **UI Library:** Mantine components (`@mantine/core`), custom CSS
* **State & Fetching:** TanStack React Query (`@tanstack/react-query`)
* **Backend & Auth:** Supabase (PostgreSQL, JWT Authentication)
* **AI Integration:** Google Gemini API (REST)

## Local Setup

### 1. Install dependencies

```bash
npm install

```

### 2. Configure Environment Variables

Create a `.env.local` file in the `front-end` directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_google_ai_studio_key

```

*Note: The app targets the `gemini-3.8-flash` model for structured JSON generation.*

### 3. Run development server

```bash
npm run dev

```

## Database Schema & Security

The Supabase backend utilizes strict Row Level Security (RLS) across four primary tables:

* **`users`:** Stores auth references and `display_name`. Viewable by all authenticated users; updates restricted to the owner.
* **`goals`:** Stores monthly/quarterly SMART goals. Viewable by the squad; inserts/updates/deletes restricted to the goal owner.
* **`checkins`:** Tracks recurring status updates linked to a user. Viewable by the squad; writes restricted to the owner.
* **`commitments`:** Relational table linking specific actionable items to check-ins. Viewable by the squad; writes restricted to the owner.

All tables require an authenticated JWT session to query or mutate records.