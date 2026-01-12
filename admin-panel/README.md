# OCEAN Admin Panel

Admin dashboard for managing the OCEAN platform.

## Setup

1. Install dependencies:
```bash
cd /opt/ocean/admin-panel
npm install
```

2. Create `.env.local` file:
```bash
cp .env.example .env.local
```

3. Update environment variables in `.env.local`

4. Run development server:
```bash
npm run dev
```

The admin panel will be available at `http://localhost:3100`

## Features

- **User Management**: Add, edit, and manage platform users
- **API Key Management**: Configure Claude, Gemini, and OpenAI API keys
- **Usage Analytics**: Monitor API usage, costs, and performance
- **Agent Monitoring**: View status and activity of all AI agents
- **Projects Overview**: Track all platform projects
- **Decisions Log**: View architecture and technical decisions

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- TailwindCSS
- PostgreSQL (via pg)
- shadcn/ui components

## Database Connection

The admin panel connects to the OCEAN PostgreSQL database on localhost:5432.

Database credentials are configured in `lib/ocean-db.ts`.

## Production Deployment

```bash
npm run build
npm start
```

The production server runs on port 3100.
