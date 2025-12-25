# Vikram's Personal Portfolio Site

A modern, performant portfolio site built with Astro, React, and Tailwind CSS, using Notion as a headless CMS.

## Tech Stack

- **Framework**: [Astro 5](https://astro.build) with React islands
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
- **CMS**: [Notion](https://notion.so) (build-time sync)
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com)

## Features

- **Static-first**: All content generated at build time for fast CDN delivery
- **Deep-linking**: Shareable URLs for each experience, project, and organization
- **Dark mode**: Automatic system preference detection with manual override
- **Accessible**: Built with Radix UI primitives for proper keyboard navigation and screen reader support
- **Type-safe**: Full TypeScript throughout

## Getting Started

### Prerequisites

- Node.js 22+ (LTS recommended)
- Bun or npm (Bun recommended for faster installs)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd personal-site

# Install dependencies (using Bun)
bun install

# Or with npm
npm install
```

### Development

```bash
# Start dev server
bun run dev

# Or with npm
npm run dev
```

Visit `http://localhost:4321`

### Building

```bash
# Build for production (runs Notion sync first)
bun run build

# Preview production build
bun run preview
```

## Notion Setup

This site uses Notion as a headless CMS. Content is synced at build time.

### 1. Create Notion Integration

1. Go to [notion.so/my-integrations](https://notion.so/my-integrations)
2. Create a new internal integration with read-only access
3. Copy the integration token

### 2. Set Up Databases

Create four databases in Notion with the following required properties:

#### All Databases
- `Slug` (Text) - URL-safe identifier
- `Published` (Checkbox) - Include on site

#### Organizations
- `Name` (Title)
- `Type` (Select) - e.g., "Company", "School"
- `URL` (URL)
- `Location` (Text)

#### Involvements
- `Title` (Title)
- `Organization` (Relation → Organizations)
- `Dates` (Date range)
- `Current` (Checkbox)
- `Type` (Select) - e.g., "Full-time", "Internship"
- `Projects` (Relation → Projects)
- `Skills Developed` (Relation → Skills)

#### Projects
- `Name` (Title)
- `Dates` (Date range)
- `Tags` (Multi-select)
- `Links` (URL)
- `Featured` (Checkbox)

#### Skills
- `Name` (Title)
- `Type` (Select) - e.g., "Language", "Framework"
- `Proficiency (1-5)` (Number)

### 3. Share Databases

Share each database with your integration (click "..." → Connections → Add your integration).

### 4. Configure Environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
NOTION_TOKEN=ntn_your_token_here
NOTION_DB_ORGANIZATIONS_ID=your_db_id
NOTION_DB_INVOLVEMENTS_ID=your_db_id
NOTION_DB_PROJECTS_ID=your_db_id
NOTION_DB_SKILLS_ID=your_db_id
```

### 5. Sync Content

```bash
bun run sync
```

## Project Structure

```
├── src/
│   ├── components/
│   │   └── panes/           # React islands for overlays
│   ├── content/
│   │   └── cache/           # Synced Notion data (gitignored)
│   ├── layouts/
│   │   └── Layout.astro     # Base HTML shell
│   ├── lib/
│   │   ├── types.ts         # TypeScript definitions
│   │   └── contentStore.ts  # Content loading utilities
│   ├── pages/
│   │   ├── index.astro
│   │   ├── involvements/[slug].astro
│   │   ├── projects/[slug].astro
│   │   └── orgs/[slug].astro
│   └── styles/
│       └── global.css       # Tailwind + design tokens
├── scripts/
│   └── notion-sync.ts       # Build-time Notion sync
├── public/
│   └── notion-assets/       # Downloaded images (gitignored)
└── dist/                    # Build output
```

## Deployment (Cloudflare Pages)

### 1. Connect Repository

1. Go to Cloudflare Pages dashboard
2. Create new project → Connect to Git
3. Select your repository

### 2. Build Settings

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Node.js version**: Set `NODE_VERSION=22` in environment variables

### 3. Environment Variables

Add the following in Cloudflare Pages project settings:

- `NOTION_TOKEN`
- `NOTION_DB_ORGANIZATIONS_ID`
- `NOTION_DB_INVOLVEMENTS_ID`
- `NOTION_DB_PROJECTS_ID`
- `NOTION_DB_SKILLS_ID`

## Scripts

| Script | Description |
|--------|-------------|
| `dev` | Start development server |
| `build` | Sync Notion + build for production |
| `preview` | Preview production build locally |
| `sync` | Sync content from Notion |
| `typecheck` | Run TypeScript type checking |
| `format` | Format code with Prettier |
| `format:check` | Check code formatting |

## Architecture

See `architecture_plan_docs/` for detailed architecture documentation:

- `notion_backend_plan.md` - Notion CMS integration details
- `front_end_ux_and_implementation_plan.md` - Frontend implementation plan

## License

Private - All rights reserved
