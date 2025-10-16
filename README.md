# Recipe Finder

A full-stack recipe cost calculator designed for the Estonian market. Search for recipes and calculate their cost using real-time grocery store prices from Selver, Rimi, and Coop - helping Estonian home cooks budget their meals with accurate local pricing.

## Features

**Public Capabilities:**
- Recipe search from TheMealDB API with 1000+ international recipes
- Browse recipe details with photos and cooking instructions
- View ingredient lists with automatic Estonian translations

**Recipe Cost Calculation:**
- Real-time price scraping from Estonian grocery stores (Selver, Rimi, Coop)
- Multi-store price comparison for best deals
- Cost estimation with confidence indicators (high/medium/low reliability)
- Per-serving cost breakdown

**Estonian Localization:**
- 105+ pre-translated ingredient names in custom dictionary
- Automatic translation fallback API for missing ingredients
- Database caching of frequently used ingredients
- Parsing statistics for translation accuracy tracking

## Technology Stack

**Backend:** Node.js, Express, SQLite, Puppeteer (web scraping), JWT authentication, dotenv

**Frontend:** Vue 3, TypeScript, Vite, Pinia state management, Vue Router

**Data Sources:** TheMealDB API, Estonian grocery store websites (Selver, Rimi, Coop)

## Project Statistics

- Development time: Full-stack recipe cost calculator
- API endpoints: 15+ endpoints
- Database tables: SQLite with prices and ingredient caching
- Service architecture: Factory pattern with modular providers
- Translation dictionary: 105+ Estonian ingredients
- Supported stores: 3 major Estonian grocery chains

## Setup Instructions

### Option 1: Local Development

**Backend Setup:**
```bash
cd backend
npm install
node server.js
```
Server runs on http://localhost:3001

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on http://localhost:5174

### Configuration

Copy `.env.example` to `.env` and configure if needed:
```bash
cp .env.example .env
```

### Database

SQLite database is automatically created in `data/prices.db` on first run with ingredient caching and price history.

## API Endpoints

**Recipe Management:**
- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/search?q=chicken` - Search recipes by name/ingredient
- `GET /api/recipes/:id` - Get recipe details by ID

**Price Calculation:**
- `POST /api/prices/recipe` - Calculate recipe cost with ingredients array
- `GET /api/prices/ingredient?ingredient=tomato` - Get single ingredient price
- `GET /api/prices/sources` - Get available grocery store sources
- `POST /api/prices/sources` - Configure active price sources

**System Info:**
- `GET /` - API health check and version info
- `GET /api/providers` - Available recipe and price providers
- `GET /api/parsing/stats` - Translation parsing statistics
- `GET /api/recipes/calculations` - Recipe calculation history

## Features Deep Dive

### Price Confidence Indicators

The app shows price reliability with confidence levels:
- **High confidence:** Ingredient found in database with exact translation
- **Medium confidence:** API translation used, price approximated
- **Low confidence:** Fallback pricing or estimation used

### Multi-Store Comparison

Compare prices across three major Estonian grocery chains:
- **Selver** - Wide selection, competitive pricing
- **Rimi** - Budget-friendly options
- **Coop** - Local and organic products

### Estonian Translation System

Built with a custom Estonian ingredient dictionary and intelligent fallback:
1. Check local dictionary (105+ pre-translated ingredients)
2. Use translation API for missing items
3. Cache results in database for future lookups
4. Track parsing success rates and confidence levels

## Requirements

- Node.js 16+
- npm or yarn
- Windows/Linux/macOS

## Development

Built with modern full-stack technologies:
- **Frontend:** Vue 3 Composition API + TypeScript + Vite for fast development
- **Backend:** Express with modular service architecture and factory pattern
- **Database:** SQLite for lightweight data persistence
- **Web Scraping:** Puppeteer for real-time grocery store prices
- **State Management:** Pinia for reactive Vue state
