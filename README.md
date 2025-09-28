# Recipe Finder

Estonian recipe cost calculator with real grocery store prices from Selver, Rimi, and Coop.

## Features

- <s Recipe search from TheMealDB API
- <ê<ê Estonian ingredient translation with fallback API
- =° Real-time grocery store price scraping
- =Ê Cost estimation with confidence indicators
- =¼ Recipe pictures and cooking instructions
- <ê Multi-store price comparison (Selver, Rimi, Coop)

## Requirements

- Node.js 16+
- npm or yarn

## Installation

### Backend Setup
```bash
cd backend
npm install
node server.js
```
Server runs on http://localhost:3001

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on http://localhost:5174

## Database

SQLite database is automatically created in `data/prices.db` on first run.

## API Endpoints

- `GET /api/recipes/search?q=chicken` - Search recipes
- `GET /api/recipes/:id` - Get recipe details
- `POST /api/recipes/:id/calculate` - Calculate recipe cost

## Configuration

Copy `.env.example` to `.env` and configure if needed.

## Estonian Translation

The app includes 105+ Estonian ingredient translations and falls back to a translation API for missing items. Confidence indicators show price reliability:

-  High confidence (database translation)
- = Medium confidence (API translation)
-   Low confidence (fallback pricing)

## Development

Built with:
- Frontend: Vue 3 + TypeScript + Vite
- Backend: Node.js + Express + SQLite
- Translation: Custom Estonian dictionary + API fallback
- Scraping: Puppeteer for grocery store prices