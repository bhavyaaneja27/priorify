# Priorify — AI Productivity Companion

Priorify helps students, professionals, freelancers, and founders prioritize tasks, plan their day, avoid missed deadlines, and stay productive.

> **Note:** Priorify is a separate product from StudyAI. It uses its own Supabase project (`priorify_schema.sql` / `priorify_rls.sql`). Legacy StudyAI SQL files in this repo are archived references only.

## Features (MVP in progress)

- **Tasks** — Smart task management with deadlines, priorities, and categories *(Phase 1)*
- **AI Action Planner** — Generate actionable plans and break goals into steps
- **Smart Daily Planner** — AI-generated daily schedule *(upcoming)*
- **Calendar** — Local calendar events *(Google sync coming later)*
- **Productivity Check** — Daily energy reflection with emoji picker
- **Focus Sessions** — Timed deep-work sessions
- **Insights** — XP, streaks, achievements, and productivity score
- **Gamification** — XP, levels, streaks, and achievements

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (auth + PostgreSQL) — *connect in a future phase*
- Google Gemini (AI plans)
- Netlify

## Getting Started

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and add your Gemini API key. Supabase credentials will be added when the Priorify database project is connected.

```bash
npm run build
npm run typecheck
npm run lint
```

## Database Setup (future)

When ready, create a **new** Supabase project and run:

1. `priorify_schema.sql`
2. `priorify_rls.sql`

Do **not** run these against the StudyAI Supabase project.

## License

Built for learning, portfolio, and educational purposes.
