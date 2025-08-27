# Calendar Worker

A minimal calendar application built with Cloudflare Workers, featuring month/week/day views, event management, and ICS export functionality.

## Features

- **Multiple Views**: Month, Week, and Day calendar views
- **Event Management**: Create, edit, and delete calendar events
- **Time Zone Support**: Full timezone handling for events
- **ICS Export**: Download calendar as .ics file
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Immediate UI updates after CRUD operations

## Architecture

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Cloudflare Workers with Hono framework
- **Database**: Cloudflare D1 (SQLite)
- **Static Assets**: Served via Workers Static Assets
- **Deployment**: Cloudflare Workers (no Pages)

## Prerequisites

- Node.js 18+ and npm
- Cloudflare account
- Wrangler CLI installed globally

## Installation

### 1. Clone and Setup

```powershell
# Navigate to the calendar-worker directory
cd calendar-worker

# Install dependencies
npm install
npm --prefix web install
```

### 2. Create D1 Database

```powershell
# Create a new D1 database
npm run db:create

# Copy the database_id from the output and update wrangler.jsonc
```

### 3. Update Configuration

Edit `wrangler.jsonc` and replace `REPLACE_WITH_D1_ID` with your actual database ID:

```json
{
  "d1_databases": [
    { 
      "binding": "DB", 
      "database_name": "calendar", 
      "database_id": "YOUR_ACTUAL_D1_ID_HERE" 
    }
  ]
}
```

### 4. Run Database Migration

```powershell
# Apply the database schema
npm run db:migrate
```

## Development

### Start Development Server

```powershell
# Start both frontend and backend in development mode
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:8787

### Frontend Only

```powershell
# Start just the frontend
npm --prefix web run dev
```

### Backend Only

```powershell
# Start just the backend
wrangler dev
```

## Building and Deployment

### Build Frontend

```powershell
# Build the React app for production
npm run build
```

### Deploy to Cloudflare

```powershell
# Build and deploy to Cloudflare Workers
npm run deploy
```

## API Endpoints

### Events

- `GET /api/events?calendarId=&from=&to=` - Get events in date range
- `POST /api/events` - Create new event
- `PATCH /api/events/:id` - Update existing event
- `DELETE /api/events/:id` - Delete event

### Calendar Export

- `GET /api/ics/:user` - Download ICS file for user

### Demo Data

- `GET /api/seed` - Seed demo calendar and events

## Database Schema

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE
);

CREATE TABLE calendars (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  calendar_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start TEXT NOT NULL,   -- ISO8601 UTC
  end TEXT NOT NULL,     -- ISO8601 UTC
  tz TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(calendar_id) REFERENCES calendars(id)
);
```

## Local Development

### Environment Variables

Create `.dev.vars` file:

```env
USER_ID=demo-user
```

### Database Seeding

The app automatically seeds demo data on first run:
- Demo user: `demo-user`
- Demo calendar: `My Calendar`
- 3 sample events for the next few days

### Testing

1. Start the development server: `npm run dev`
2. Open http://localhost:3000
3. The calendar will automatically seed with demo data
4. Try creating, editing, and deleting events
5. Test different calendar views (Month, Week, Day)

## Production Deployment

### 1. Build Frontend

```powershell
npm run build
```

### 2. Deploy Worker

```powershell
npm run deploy
```

### 3. Verify Deployment

Check your Cloudflare Workers dashboard to ensure the worker is running correctly.

## Troubleshooting

### Common Issues

1. **D1 Database Not Found**
   - Ensure you've created the D1 database and updated `wrangler.jsonc`
   - Run `npm run db:migrate` to apply schema

2. **Frontend Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm --prefix web run lint`

3. **Worker Deployment Fails**
   - Verify wrangler is authenticated: `wrangler login`
   - Check D1 database exists and is accessible

4. **Events Not Loading**
   - Check browser console for API errors
   - Verify the `/api/seed` endpoint works
   - Check D1 database for data

### Debug Mode

```powershell
# Run with detailed logging
wrangler dev --log-level debug
```

## File Structure

```
calendar-worker/
├── web/                          # React frontend
│   ├── src/
│   │   ├── components/calendar/  # Calendar components
│   │   ├── lib/                  # Utilities and API
│   │   └── App.tsx              # Main app component
│   ├── package.json              # Frontend dependencies
│   └── vite.config.ts           # Vite configuration
├── worker/
│   └── index.ts                 # Cloudflare Worker
├── schema.sql                   # D1 database schema
├── wrangler.jsonc              # Worker configuration
└── package.json                 # Root dependencies
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Cloudflare Workers documentation
3. Check the browser console for errors
4. Verify D1 database connectivity
