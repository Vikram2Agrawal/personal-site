# Complete Project Setup Instructions

> **For AI Assistant on Personal Laptop**: Follow these instructions EXACTLY. Execute each command and create each file as specified. Do not skip steps. Do not improvise.

## Prerequisites

- macOS or Linux
- Terminal access
- Git installed
- Internet connection (no corporate firewall)

---

## PHASE 1: System Setup

### Step 1.1: Install Node.js

```bash
# Check if Node is installed
node -v

# If not installed or version < 20, install via Homebrew:
brew install node

# Verify installation (should show v20+ or v22+)
node -v
npm -v
```

### Step 1.2: Install Bun (faster package manager)

```bash
curl -fsSL https://bun.sh/install | bash

# Reload shell
exec /bin/zsh

# Verify
bun --version
```

### Step 1.3: Clone the Repository

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/personal-site.git
cd personal-site
```

---

## PHASE 2: Project Scaffolding

### Step 2.1: Create Node Version File

```bash
echo "22" > .nvmrc
```

### Step 2.2: Initialize Astro Project

Run this command and accept defaults:

```bash
npm create astro@latest -- . --template minimal --typescript strict --install --no-git -y
```

If this fails, manually create the files in Step 2.3.

### Step 2.3: Manual Project Files (if Step 2.2 failed)

Create `package.json`:

```bash
cat > package.json << 'EOF'
{
  "name": "vikram-personal-site",
  "type": "module",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "typecheck": "astro check",
    "sync": "tsx scripts/notion-sync.ts",
    "prebuild": "npm run sync",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "dependencies": {
    "@astrojs/react": "^4.4.2",
    "@radix-ui/react-dialog": "^1.1.15",
    "@tailwindcss/vite": "^4.1.18",
    "astro": "^5.16.6",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "tailwindcss": "^4.1.18"
  },
  "devDependencies": {
    "@notionhq/client": "^5.6.0",
    "@types/react": "^19.2.7",
    "@types/react-dom": "^19.2.3",
    "@typescript-eslint/parser": "^8.50.1",
    "dotenv": "^17.2.3",
    "p-limit": "^7.2.0",
    "prettier": "^3.7.4",
    "prettier-plugin-astro": "^0.14.1",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3",
    "zod": "^4.2.1"
  }
}
EOF
```

Create `tsconfig.json`:

```bash
cat > tsconfig.json << 'EOF'
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
EOF
```

Create `astro.config.mjs`:

```bash
cat > astro.config.mjs << 'EOF'
// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
EOF
```

### Step 2.4: Install Dependencies

```bash
bun install
```

---

## PHASE 3: Create Directory Structure

```bash
mkdir -p src/components/panes
mkdir -p src/content/cache
mkdir -p src/layouts
mkdir -p src/lib
mkdir -p src/pages/involvements
mkdir -p src/pages/projects
mkdir -p src/pages/orgs
mkdir -p src/styles
mkdir -p scripts
mkdir -p public/notion-assets
```

---

## PHASE 4: Environment Configuration

### Step 4.1: Create .env.local

**IMPORTANT**: Get the actual credentials from Vikram or the secure credential store.

```bash
cat > .env.local << 'EOF'
# Notion Integration
# Get actual token from: https://www.notion.so/my-integrations
NOTION_TOKEN=YOUR_NOTION_TOKEN_HERE

# Database IDs (get from Notion database URLs)
NOTION_DB_ORGANIZATIONS_ID=YOUR_ORG_DB_ID
NOTION_DB_INVOLVEMENTS_ID=YOUR_INV_DB_ID
NOTION_DB_PROJECTS_ID=YOUR_PROJ_DB_ID
NOTION_DB_SKILLS_ID=YOUR_SKILLS_DB_ID
EOF
```

**Actual credentials (copy these values):**
- NOTION_TOKEN: Check 1Password or ask Vikram
- NOTION_DB_ORGANIZATIONS_ID: `19f6ac6db7a44885b70e9a4d48bb755d`
- NOTION_DB_INVOLVEMENTS_ID: `0505522332894bf4b274fd27ce744a4d`
- NOTION_DB_PROJECTS_ID: `5705f2d7f0654194a5dce24786b289ff`
- NOTION_DB_SKILLS_ID: `54030210120e43b9bc018e7778932ea4`

### Step 4.2: Create .env.example (for reference)

```bash
cat > .env.example << 'EOF'
# Notion Integration
NOTION_TOKEN=ntn_your_token_here

# Database IDs
NOTION_DB_ORGANIZATIONS_ID=
NOTION_DB_INVOLVEMENTS_ID=
NOTION_DB_PROJECTS_ID=
NOTION_DB_SKILLS_ID=
EOF
```

### Step 4.3: Create .gitignore

```bash
cat > .gitignore << 'EOF'
# build output
dist/
# generated types
.astro/

# dependencies
node_modules/

# logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# environment variables
.env
.env.local
.env.production

# Notion sync cache (regenerated at build time)
src/content/cache/

# Downloaded assets from Notion (regenerated at build time)
public/notion-assets/

# Bun
bun.lockb

# macOS-specific files
.DS_Store

# jetbrains setting folder
.idea/
EOF
```

### Step 4.4: Create .prettierrc

```bash
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "plugins": ["prettier-plugin-astro"],
  "overrides": [
    {
      "files": "*.astro",
      "options": {
        "parser": "astro"
      }
    }
  ]
}
EOF
```

---

## PHASE 5: Create TypeScript Types

### Step 5.1: Create src/lib/types.ts

```bash
cat > src/lib/types.ts << 'EOF'
/**
 * Type definitions for the portfolio site content.
 * These match the output contract from the Notion sync pipeline.
 */

// Supporting types
export interface ResolvedRef {
  id: string;
  slug: string;
  title: string;
  sharePath: string;
}

export interface Icon {
  type: 'emoji' | 'image';
  value: string;
}

export interface DateRange {
  start: string;
  end?: string;
}

export interface InlineToken {
  type: 'text' | 'mention' | 'link' | 'code';
  text?: string;
  entityType?: 'skill' | 'project' | 'involvement' | 'organization';
  slug?: string;
  label?: string;
  url?: string;
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
  color?: string;
}

export interface BlockNode {
  type: string;
  content?: InlineToken[];
  children?: BlockNode[];
  language?: string;
  url?: string;
  caption?: InlineToken[];
}

export interface Organization {
  id: string;
  slug: string;
  sharePath: string;
  name: string;
  published: boolean;
  type?: string;
  logo?: string;
  url?: string;
  location?: string;
  involvements: ResolvedRef[];
  context: BlockNode[];
  icon?: Icon;
  cover?: string;
}

export interface Involvement {
  id: string;
  slug: string;
  sharePath: string;
  title: string;
  published: boolean;
  organization: ResolvedRef;
  dates: DateRange;
  current: boolean;
  type?: string;
  location?: string;
  projects: ResolvedRef[];
  skills: ResolvedRef[];
  sections: {
    tldr: BlockNode[];
    roleOverview: BlockNode[];
  };
  icon?: Icon;
  cover?: string;
}

export interface Project {
  id: string;
  slug: string;
  sharePath: string;
  name: string;
  published: boolean;
  dates?: DateRange;
  involvements: ResolvedRef[];
  organizations: ResolvedRef[];
  skills: ResolvedRef[];
  tags: string[];
  links?: string[];
  sections: {
    overview: BlockNode[];
    underTheHood: BlockNode[];
    impact: BlockNode[];
  };
  icon?: Icon;
  cover?: string;
  featured?: boolean;
}

export interface Skill {
  id: string;
  slug: string;
  name: string;
  published: boolean;
  type?: string;
  proficiency?: number;
  relatedProjects: ResolvedRef[];
  relatedInvolvements: ResolvedRef[];
  context: BlockNode[];
  icon?: Icon;
}

export interface SyncMeta {
  buildTime: string;
  schemaVersion: string;
}

export interface ContentIndex<T> {
  all: T[];
  bySlug: Record<string, T>;
  byId: Record<string, T>;
}

export type PaneType = 'involvement' | 'project' | 'organization' | 'skill';

export interface PaneState {
  type: PaneType;
  slug: string;
}
EOF
```

---

## PHASE 6: Create Notion Sync Script

### Step 6.1: Create scripts/notion-sync.ts

```bash
cat > scripts/notion-sync.ts << 'ENDOFFILE'
/**
 * Notion Sync Script
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

import { Client, isFullPage, isFullBlock } from '@notionhq/client';
import type {
  PageObjectResponse,
  BlockObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints.js';
import * as fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import pLimit from 'p-limit';
import type {
  Organization,
  Involvement,
  Project,
  Skill,
  ResolvedRef,
  Icon,
  BlockNode,
  InlineToken,
  SyncMeta,
} from '../src/lib/types.js';

const limit = pLimit(3);

const CACHE_DIR = path.join(process.cwd(), 'src/content/cache');
const ASSETS_DIR = path.join(process.cwd(), 'public/notion-assets');

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const DB_IDS = {
  organizations: process.env.NOTION_DB_ORGANIZATIONS_ID,
  involvements: process.env.NOTION_DB_INVOLVEMENTS_ID,
  projects: process.env.NOTION_DB_PROJECTS_ID,
  skills: process.env.NOTION_DB_SKILLS_ID,
} as const;

function getTitle(page: PageObjectResponse): string {
  const titleProp = Object.values(page.properties).find(
    (p) => p.type === 'title'
  );
  if (titleProp?.type === 'title') {
    return titleProp.title.map((t) => t.plain_text).join('');
  }
  return '';
}

function getRichText(
  page: PageObjectResponse,
  propName: string
): string | undefined {
  const prop = page.properties[propName];
  if (prop?.type === 'rich_text') {
    const text = prop.rich_text.map((t) => t.plain_text).join('');
    return text || undefined;
  }
  return undefined;
}

function getCheckbox(page: PageObjectResponse, propName: string): boolean {
  const prop = page.properties[propName];
  if (prop?.type === 'checkbox') {
    return prop.checkbox;
  }
  return false;
}

function getSelect(
  page: PageObjectResponse,
  propName: string
): string | undefined {
  const prop = page.properties[propName];
  if (prop?.type === 'select' && prop.select) {
    return prop.select.name;
  }
  return undefined;
}

function getMultiSelect(page: PageObjectResponse, propName: string): string[] {
  const prop = page.properties[propName];
  if (prop?.type === 'multi_select') {
    return prop.multi_select.map((s) => s.name);
  }
  return [];
}

function getUrl(page: PageObjectResponse, propName: string): string | undefined {
  const prop = page.properties[propName];
  if (prop?.type === 'url' && prop.url) {
    return prop.url;
  }
  return undefined;
}

function getDate(
  page: PageObjectResponse,
  propName: string
): { start: string; end?: string } | undefined {
  const prop = page.properties[propName];
  if (prop?.type === 'date' && prop.date) {
    return {
      start: prop.date.start,
      end: prop.date.end || undefined,
    };
  }
  return undefined;
}

function getRelationIds(page: PageObjectResponse, propName: string): string[] {
  const prop = page.properties[propName];
  if (prop?.type === 'relation') {
    return prop.relation.map((r) => r.id);
  }
  return [];
}

function getNumber(
  page: PageObjectResponse,
  propName: string
): number | undefined {
  const prop = page.properties[propName];
  if (prop?.type === 'number' && prop.number !== null) {
    return prop.number;
  }
  return undefined;
}

function getIcon(page: PageObjectResponse): Icon | undefined {
  if (!page.icon) return undefined;
  if (page.icon.type === 'emoji') {
    return { type: 'emoji', value: page.icon.emoji };
  }
  if (page.icon.type === 'external') {
    return { type: 'image', value: page.icon.external.url };
  }
  if (page.icon.type === 'file') {
    return { type: 'image', value: page.icon.file.url };
  }
  return undefined;
}

function getCover(page: PageObjectResponse): string | undefined {
  if (!page.cover) return undefined;
  if (page.cover.type === 'external') {
    return page.cover.external.url;
  }
  if (page.cover.type === 'file') {
    return page.cover.file.url;
  }
  return undefined;
}

function richTextToTokens(richText: RichTextItemResponse[]): InlineToken[] {
  return richText.map((item): InlineToken => {
    if (item.type === 'mention') {
      if (item.mention.type === 'page') {
        return {
          type: 'mention',
          label: item.plain_text,
        };
      }
      return { type: 'text', text: item.plain_text };
    }

    if (item.type === 'text') {
      if (item.text.link) {
        return {
          type: 'link',
          text: item.plain_text,
          url: item.text.link.url,
        };
      }
      return {
        type: 'text',
        text: item.plain_text,
        bold: item.annotations.bold || undefined,
        italic: item.annotations.italic || undefined,
        strikethrough: item.annotations.strikethrough || undefined,
        underline: item.annotations.underline || undefined,
        color:
          item.annotations.color !== 'default'
            ? item.annotations.color
            : undefined,
      };
    }

    return { type: 'text', text: item.plain_text };
  });
}

async function fetchPageBlocks(pageId: string): Promise<BlockObjectResponse[]> {
  const blocks: BlockObjectResponse[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await limit(() =>
      notion.blocks.children.list({
        block_id: pageId,
        start_cursor: cursor,
        page_size: 100,
      })
    );

    for (const block of response.results) {
      if (isFullBlock(block)) {
        blocks.push(block);
        if (block.has_children) {
          const children = await fetchPageBlocks(block.id);
          (block as any)._children = children;
        }
      }
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return blocks;
}

function blocksToNodes(blocks: BlockObjectResponse[]): BlockNode[] {
  return blocks.map((block): BlockNode => {
    const children = (block as any)._children
      ? blocksToNodes((block as any)._children)
      : undefined;

    switch (block.type) {
      case 'paragraph':
        return {
          type: 'paragraph',
          content: richTextToTokens(block.paragraph.rich_text),
          children,
        };
      case 'heading_1':
        return {
          type: 'heading_1',
          content: richTextToTokens(block.heading_1.rich_text),
        };
      case 'heading_2':
        return {
          type: 'heading_2',
          content: richTextToTokens(block.heading_2.rich_text),
        };
      case 'heading_3':
        return {
          type: 'heading_3',
          content: richTextToTokens(block.heading_3.rich_text),
        };
      case 'bulleted_list_item':
        return {
          type: 'bulleted_list_item',
          content: richTextToTokens(block.bulleted_list_item.rich_text),
          children,
        };
      case 'numbered_list_item':
        return {
          type: 'numbered_list_item',
          content: richTextToTokens(block.numbered_list_item.rich_text),
          children,
        };
      case 'code':
        return {
          type: 'code',
          content: richTextToTokens(block.code.rich_text),
          language: block.code.language,
        };
      case 'quote':
        return {
          type: 'quote',
          content: richTextToTokens(block.quote.rich_text),
          children,
        };
      case 'callout':
        return {
          type: 'callout',
          content: richTextToTokens(block.callout.rich_text),
          children,
        };
      case 'divider':
        return { type: 'divider' };
      case 'image':
        const imageUrl =
          block.image.type === 'external'
            ? block.image.external.url
            : block.image.file.url;
        return {
          type: 'image',
          url: imageUrl,
          caption: block.image.caption
            ? richTextToTokens(block.image.caption)
            : undefined,
        };
      default:
        return { type: block.type };
    }
  });
}

function extractSections(
  blocks: BlockNode[],
  headings: string[]
): Record<string, BlockNode[]> {
  const sections: Record<string, BlockNode[]> = {};
  let currentHeading: string | null = null;
  let currentBlocks: BlockNode[] = [];

  for (const block of blocks) {
    if (block.type === 'heading_2' && block.content) {
      const headingText = block.content.map((t) => t.text || '').join('');

      if (currentHeading) {
        sections[currentHeading] = currentBlocks;
      }

      const matchedHeading = headings.find(
        (h) => headingText.toLowerCase().includes(h.toLowerCase())
      );

      if (matchedHeading) {
        currentHeading = matchedHeading;
        currentBlocks = [];
      } else {
        currentHeading = null;
        currentBlocks = [];
      }
    } else if (currentHeading) {
      currentBlocks.push(block);
    }
  }

  if (currentHeading) {
    sections[currentHeading] = currentBlocks;
  }

  return sections;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchDatabase(
  databaseId: string
): Promise<PageObjectResponse[]> {
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await limit(() =>
      notion.databases.query({
        database_id: databaseId,
        start_cursor: cursor,
        page_size: 100,
        filter: {
          property: 'Published',
          checkbox: { equals: true },
        },
      })
    );

    for (const page of response.results) {
      if (isFullPage(page)) {
        pages.push(page);
      }
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return pages;
}

async function sync() {
  console.log('Starting Notion sync...\n');

  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.mkdir(ASSETS_DIR, { recursive: true });

  const hasNotionConfig = process.env.NOTION_TOKEN && DB_IDS.organizations;

  if (!hasNotionConfig) {
    console.log('Notion credentials not configured. Creating placeholder data...\n');

    const placeholderOrgs: Organization[] = [];
    const placeholderInvolvements: Involvement[] = [];
    const placeholderProjects: Project[] = [];
    const placeholderSkills: Skill[] = [];

    await fs.writeFile(
      path.join(CACHE_DIR, 'organizations.json'),
      JSON.stringify(placeholderOrgs, null, 2)
    );
    await fs.writeFile(
      path.join(CACHE_DIR, 'involvements.json'),
      JSON.stringify(placeholderInvolvements, null, 2)
    );
    await fs.writeFile(
      path.join(CACHE_DIR, 'projects.json'),
      JSON.stringify(placeholderProjects, null, 2)
    );
    await fs.writeFile(
      path.join(CACHE_DIR, 'skills.json'),
      JSON.stringify(placeholderSkills, null, 2)
    );
    await fs.writeFile(
      path.join(CACHE_DIR, 'meta.json'),
      JSON.stringify(
        {
          buildTime: new Date().toISOString(),
          schemaVersion: '1.0.0',
          placeholder: true,
        },
        null,
        2
      )
    );

    console.log('Created placeholder cache files.');
    return;
  }

  const pageMap = new Map<
    string,
    { type: string; slug: string; title: string }
  >();

  console.log('Fetching organizations...');
  const orgPages = DB_IDS.organizations
    ? await fetchDatabase(DB_IDS.organizations)
    : [];
  console.log(`  Found ${orgPages.length} organizations`);

  console.log('Fetching involvements...');
  const invPages = DB_IDS.involvements
    ? await fetchDatabase(DB_IDS.involvements)
    : [];
  console.log(`  Found ${invPages.length} involvements`);

  console.log('Fetching projects...');
  const projPages = DB_IDS.projects
    ? await fetchDatabase(DB_IDS.projects)
    : [];
  console.log(`  Found ${projPages.length} projects`);

  console.log('Fetching skills...');
  const skillPages = DB_IDS.skills ? await fetchDatabase(DB_IDS.skills) : [];
  console.log(`  Found ${skillPages.length} skills`);

  for (const page of orgPages) {
    const title = getTitle(page);
    const slug = getRichText(page, 'Slug') || generateSlug(title);
    pageMap.set(page.id, { type: 'organization', slug, title });
  }
  for (const page of invPages) {
    const title = getTitle(page);
    const slug = getRichText(page, 'Slug') || generateSlug(title);
    pageMap.set(page.id, { type: 'involvement', slug, title });
  }
  for (const page of projPages) {
    const title = getTitle(page);
    const slug = getRichText(page, 'Slug') || generateSlug(title);
    pageMap.set(page.id, { type: 'project', slug, title });
  }
  for (const page of skillPages) {
    const title = getTitle(page);
    const slug = getRichText(page, 'Slug') || generateSlug(title);
    pageMap.set(page.id, { type: 'skill', slug, title });
  }

  function resolveRefs(ids: string[]): ResolvedRef[] {
    return ids
      .map((id) => {
        const info = pageMap.get(id);
        if (!info) return null;
        return {
          id,
          slug: info.slug,
          title: info.title,
          sharePath: `/${info.type}s/${info.slug}`,
        };
      })
      .filter((ref): ref is ResolvedRef => ref !== null);
  }

  console.log('\nProcessing organizations...');
  const organizations: Organization[] = await Promise.all(
    orgPages.map(async (page) => {
      const title = getTitle(page);
      const slug = getRichText(page, 'Slug') || generateSlug(title);
      const blocks = await fetchPageBlocks(page.id);

      return {
        id: page.id,
        slug,
        sharePath: `/orgs/${slug}`,
        name: title,
        published: true,
        type: getSelect(page, 'Type'),
        logo: undefined,
        url: getUrl(page, 'URL'),
        location: getRichText(page, 'Location'),
        involvements: resolveRefs(getRelationIds(page, 'Involvements')),
        context: blocksToNodes(blocks),
        icon: getIcon(page),
        cover: getCover(page),
      };
    })
  );

  console.log('Processing involvements...');
  const involvements: Involvement[] = await Promise.all(
    invPages.map(async (page) => {
      const title = getTitle(page);
      const slug = getRichText(page, 'Slug') || generateSlug(title);
      const blocks = await fetchPageBlocks(page.id);
      const nodes = blocksToNodes(blocks);
      const sections = extractSections(nodes, ['TLDR', 'Role Overview']);

      const orgIds = getRelationIds(page, 'Organization');
      const orgRef = resolveRefs(orgIds)[0] || {
        id: '',
        slug: '',
        title: '',
        sharePath: '',
      };

      return {
        id: page.id,
        slug,
        sharePath: `/involvements/${slug}`,
        title,
        published: true,
        organization: orgRef,
        dates: getDate(page, 'Dates') || { start: '' },
        current: getCheckbox(page, 'Current'),
        type: getSelect(page, 'Type'),
        location: getSelect(page, 'Location') || getRichText(page, 'Location'),
        projects: resolveRefs(getRelationIds(page, 'Projects')),
        skills: resolveRefs(getRelationIds(page, 'Skills Developed')),
        sections: {
          tldr: sections['TLDR'] || [],
          roleOverview: sections['Role Overview'] || [],
        },
        icon: getIcon(page),
        cover: getCover(page),
      };
    })
  );

  console.log('Processing projects...');
  const projects: Project[] = await Promise.all(
    projPages.map(async (page) => {
      const title = getTitle(page);
      const slug = getRichText(page, 'Slug') || generateSlug(title);
      const blocks = await fetchPageBlocks(page.id);
      const nodes = blocksToNodes(blocks);
      const sections = extractSections(nodes, [
        'Project Overview',
        'Under the Hood',
        'Impact',
      ]);

      return {
        id: page.id,
        slug,
        sharePath: `/projects/${slug}`,
        name: title,
        published: true,
        dates: getDate(page, 'Dates'),
        involvements: resolveRefs(getRelationIds(page, 'Involvements')),
        organizations: resolveRefs(getRelationIds(page, 'Involved With')),
        skills: resolveRefs(getRelationIds(page, 'Skills Developed')),
        tags: getMultiSelect(page, 'Tags'),
        links: getUrl(page, 'Links') ? [getUrl(page, 'Links')!] : undefined,
        sections: {
          overview: sections['Project Overview'] || [],
          underTheHood: sections['Under the Hood'] || [],
          impact: sections['Impact'] || [],
        },
        icon: getIcon(page),
        cover: getCover(page),
        featured: getCheckbox(page, 'Featured'),
      };
    })
  );

  console.log('Processing skills...');
  const skills: Skill[] = await Promise.all(
    skillPages.map(async (page) => {
      const title = getTitle(page);
      const slug = getRichText(page, 'Slug') || generateSlug(title);
      const blocks = await fetchPageBlocks(page.id);

      return {
        id: page.id,
        slug,
        name: title,
        published: true,
        type: getSelect(page, 'Type'),
        proficiency: getNumber(page, 'Proficiency (1-5)'),
        relatedProjects: resolveRefs(getRelationIds(page, 'Related Projects')),
        relatedInvolvements: resolveRefs(
          getRelationIds(page, 'Related Involvements')
        ),
        context: blocksToNodes(blocks),
        icon: getIcon(page),
      };
    })
  );

  console.log('\nWriting cache files...');

  await fs.writeFile(
    path.join(CACHE_DIR, 'organizations.json'),
    JSON.stringify(organizations, null, 2)
  );
  await fs.writeFile(
    path.join(CACHE_DIR, 'involvements.json'),
    JSON.stringify(involvements, null, 2)
  );
  await fs.writeFile(
    path.join(CACHE_DIR, 'projects.json'),
    JSON.stringify(projects, null, 2)
  );
  await fs.writeFile(
    path.join(CACHE_DIR, 'skills.json'),
    JSON.stringify(skills, null, 2)
  );

  const meta: SyncMeta = {
    buildTime: new Date().toISOString(),
    schemaVersion: '1.0.0',
  };
  await fs.writeFile(
    path.join(CACHE_DIR, 'meta.json'),
    JSON.stringify(meta, null, 2)
  );

  console.log('\nSync complete!');
  console.log(`  Organizations: ${organizations.length}`);
  console.log(`  Involvements: ${involvements.length}`);
  console.log(`  Projects: ${projects.length}`);
  console.log(`  Skills: ${skills.length}`);
}

sync().catch((error) => {
  console.error('Sync failed:', error);
  process.exit(1);
});
ENDOFFILE
```

---

## PHASE 7: Create Content Store

### Step 7.1: Create src/lib/contentStore.ts

```bash
cat > src/lib/contentStore.ts << 'EOF'
/**
 * Content Store - Loads cached Notion content
 */

import type {
  Organization,
  Involvement,
  Project,
  Skill,
  ContentIndex,
  SyncMeta,
} from './types';

import organizationsData from '../content/cache/organizations.json';
import involvementsData from '../content/cache/involvements.json';
import projectsData from '../content/cache/projects.json';
import skillsData from '../content/cache/skills.json';
import metaData from '../content/cache/meta.json';

const organizations = organizationsData as Organization[];
const involvements = involvementsData as Involvement[];
const projects = projectsData as Project[];
const skills = skillsData as Skill[];
const meta = metaData as SyncMeta;

function buildIndex<T extends { id: string; slug: string }>(
  items: T[]
): ContentIndex<T> {
  const bySlug: Record<string, T> = {};
  const byId: Record<string, T> = {};

  for (const item of items) {
    bySlug[item.slug] = item;
    byId[item.id] = item;
  }

  return { all: items, bySlug, byId };
}

export const organizationsIndex = buildIndex(organizations);
export const involvementsIndex = buildIndex(involvements);
export const projectsIndex = buildIndex(projects);
export const skillsIndex = buildIndex(skills);

export function getOrganization(slug: string): Organization | undefined {
  return organizationsIndex.bySlug[slug];
}

export function getInvolvement(slug: string): Involvement | undefined {
  return involvementsIndex.bySlug[slug];
}

export function getProject(slug: string): Project | undefined {
  return projectsIndex.bySlug[slug];
}

export function getSkill(slug: string): Skill | undefined {
  return skillsIndex.bySlug[slug];
}

export function getCurrentInvolvements(): Involvement[] {
  return involvements.filter((inv) => inv.current || !inv.dates.end);
}

export function getFeaturedProjects(): Project[] {
  return projects.filter(
    (p) => p.featured && p.involvements.length === 0
  );
}

export { organizations, involvements, projects, skills, meta };
EOF
```

---

## PHASE 8: Create Styles

### Step 8.1: Create src/styles/global.css

```bash
cat > src/styles/global.css << 'EOF'
@import "tailwindcss";

:root {
  --color-bg: #fafafa;
  --color-fg: #171717;
  --color-accent: #3b82f6;
  --color-muted: #737373;
  --color-surface: rgba(255, 255, 255, 0.8);
  --color-border: rgba(0, 0, 0, 0.1);

  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;

  --radius-sm: 0.375rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;

  --glass-blur: 24px;
  --glass-saturation: 180%;
  --glass-opacity: 0.7;

  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 150ms;
  --duration-normal: 300ms;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0a0a0a;
    --color-fg: #fafafa;
    --color-accent: #60a5fa;
    --color-muted: #a3a3a3;
    --color-surface: rgba(30, 30, 30, 0.8);
    --color-border: rgba(255, 255, 255, 0.1);
  }
}

.dark {
  --color-bg: #0a0a0a;
  --color-fg: #fafafa;
  --color-accent: #60a5fa;
  --color-muted: #a3a3a3;
  --color-surface: rgba(30, 30, 30, 0.8);
  --color-border: rgba(255, 255, 255, 0.1);
}

html {
  font-family: var(--font-sans);
  background-color: var(--color-bg);
  color: var(--color-fg);
}

body {
  margin: 0;
  min-height: 100vh;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
EOF
```

---

## PHASE 9: Create Layout

### Step 9.1: Create src/layouts/Layout.astro

```bash
cat > src/layouts/Layout.astro << 'EOF'
---
interface Props {
  title: string;
  description?: string;
  ogImage?: string;
}

const { 
  title, 
  description = "Vikram Agrawal - Software & Product Engineer", 
  ogImage = "/og-default.png" 
} = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:type" content="website" />
    
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={ogImage} />
    
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
    
    <script is:inline>
      const theme = (() => {
        if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
          return localStorage.getItem('theme');
        }
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }
        return 'light';
      })();
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    </script>
  </head>
  <body>
    <slot />
  </body>
</html>

<style is:global>
  @import "../styles/global.css";
</style>
EOF
```

---

## PHASE 10: Create Pane Controller

### Step 10.1: Create src/components/panes/PaneController.tsx

```bash
cat > src/components/panes/PaneController.tsx << 'EOF'
import { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { PaneState, PaneType } from '../../lib/types';

interface PaneControllerProps {
  initialPane?: PaneState | null;
}

export default function PaneController({ initialPane }: PaneControllerProps) {
  const [pane, setPane] = useState<PaneState | null>(initialPane || null);
  const [isOpen, setIsOpen] = useState(!!initialPane);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePaneChange = () => {
      if (pane) {
        const path = `/${pane.type}s/${pane.slug}`;
        if (window.location.pathname !== path) {
          window.history.pushState({}, '', path);
        }
      } else if (window.location.pathname !== '/') {
        window.history.pushState({}, '', '/');
      }
    };

    handlePaneChange();
  }, [pane]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/(involvements|projects|orgs)\/(.+)$/);

      if (match) {
        const typeMap: Record<string, PaneType> = {
          involvements: 'involvement',
          projects: 'project',
          orgs: 'organization',
        };
        setPane({ type: typeMap[match[1]], slug: match[2] });
        setIsOpen(true);
      } else {
        setPane(null);
        setIsOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOpenPane = (e: CustomEvent<PaneState>) => {
      setPane(e.detail);
      setIsOpen(true);
    };

    window.addEventListener('openPane', handleOpenPane as EventListener);
    return () =>
      window.removeEventListener('openPane', handleOpenPane as EventListener);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setPane(null);
  }, []);

  const renderPaneContent = () => {
    if (!pane) return null;

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 capitalize">
          {pane.type}: {pane.slug}
        </h2>
        <p className="text-[var(--color-muted)]">
          Pane content will be loaded here based on the entity type and slug.
        </p>
      </div>
    );
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed right-0 top-0 h-full w-full max-w-2xl bg-[var(--color-bg)] border-l border-[var(--color-border)] shadow-2xl z-50 overflow-y-auto">
          <div className="sticky top-0 flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
            <Dialog.Title className="text-lg font-semibold capitalize">
              {pane?.type || 'Details'}
            </Dialog.Title>
            <Dialog.Close className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>
          {renderPaneContent()}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function openPane(type: PaneType, slug: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('openPane', { detail: { type, slug } })
    );
  }
}
EOF
```

---

## PHASE 11: Create Pages

### Step 11.1: Create src/pages/index.astro

```bash
cat > src/pages/index.astro << 'EOF'
---
import Layout from '../layouts/Layout.astro';
import PaneController from '../components/panes/PaneController';
---

<Layout title="Vikram Agrawal | Software & Product Engineer">
  <main class="min-h-screen">
    <section class="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 class="text-5xl md:text-7xl font-bold tracking-tight mb-6">
        Vikram Agrawal
      </h1>
      <p class="text-xl md:text-2xl text-[var(--color-muted)] max-w-2xl mb-8">
        Software & Product Engineer
      </p>
      <div class="flex gap-4">
        <a 
          href="#experience" 
          class="px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          View Experience
        </a>
        <a 
          href="#projects" 
          class="px-6 py-3 border border-[var(--color-border)] rounded-lg font-medium hover:bg-[var(--color-surface)] transition-colors"
        >
          Projects
        </a>
      </div>
    </section>

    <section id="experience" class="py-24 px-4">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl font-bold mb-12">Experience</h2>
        <p class="text-[var(--color-muted)]">
          Content will be loaded from Notion...
        </p>
      </div>
    </section>

    <section id="projects" class="py-24 px-4">
      <div class="max-w-4xl mx-auto">
        <h2 class="text-3xl font-bold mb-12">Projects</h2>
        <p class="text-[var(--color-muted)]">
          Content will be loaded from Notion...
        </p>
      </div>
    </section>
  </main>

  <PaneController client:load />
</Layout>
EOF
```

### Step 11.2: Create src/pages/involvements/[slug].astro

```bash
cat > 'src/pages/involvements/[slug].astro' << 'EOF'
---
import Layout from '../../layouts/Layout.astro';
import PaneController from '../../components/panes/PaneController';
import { involvements } from '../../lib/contentStore';

export async function getStaticPaths() {
  return involvements.map((inv) => ({
    params: { slug: inv.slug },
    props: { involvement: inv },
  }));
}

const { slug } = Astro.params;
const { involvement } = Astro.props;

const title = involvement
  ? `${involvement.title} | Vikram Agrawal`
  : 'Experience | Vikram Agrawal';
---

<Layout title={title}>
  <main class="min-h-screen">
    <section class="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 class="text-5xl md:text-7xl font-bold tracking-tight mb-6">Vikram Agrawal</h1>
      <p class="text-xl md:text-2xl text-[var(--color-muted)] max-w-2xl mb-8">Software & Product Engineer</p>
    </section>
  </main>
  <PaneController client:load initialPane={{ type: 'involvement', slug: slug! }} />
</Layout>
EOF
```

### Step 11.3: Create src/pages/projects/[slug].astro

```bash
cat > 'src/pages/projects/[slug].astro' << 'EOF'
---
import Layout from '../../layouts/Layout.astro';
import PaneController from '../../components/panes/PaneController';
import { projects } from '../../lib/contentStore';

export async function getStaticPaths() {
  return projects.map((proj) => ({
    params: { slug: proj.slug },
    props: { project: proj },
  }));
}

const { slug } = Astro.params;
const { project } = Astro.props;

const title = project
  ? `${project.name} | Vikram Agrawal`
  : 'Project | Vikram Agrawal';
---

<Layout title={title}>
  <main class="min-h-screen">
    <section class="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 class="text-5xl md:text-7xl font-bold tracking-tight mb-6">Vikram Agrawal</h1>
      <p class="text-xl md:text-2xl text-[var(--color-muted)] max-w-2xl mb-8">Software & Product Engineer</p>
    </section>
  </main>
  <PaneController client:load initialPane={{ type: 'project', slug: slug! }} />
</Layout>
EOF
```

### Step 11.4: Create src/pages/orgs/[slug].astro

```bash
cat > 'src/pages/orgs/[slug].astro' << 'EOF'
---
import Layout from '../../layouts/Layout.astro';
import PaneController from '../../components/panes/PaneController';
import { organizations } from '../../lib/contentStore';

export async function getStaticPaths() {
  return organizations.map((org) => ({
    params: { slug: org.slug },
    props: { organization: org },
  }));
}

const { slug } = Astro.params;
const { organization } = Astro.props;

const title = organization
  ? `${organization.name} | Vikram Agrawal`
  : 'Organization | Vikram Agrawal';
---

<Layout title={title}>
  <main class="min-h-screen">
    <section class="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 class="text-5xl md:text-7xl font-bold tracking-tight mb-6">Vikram Agrawal</h1>
      <p class="text-xl md:text-2xl text-[var(--color-muted)] max-w-2xl mb-8">Software & Product Engineer</p>
    </section>
  </main>
  <PaneController client:load initialPane={{ type: 'organization', slug: slug! }} />
</Layout>
EOF
```

---

## PHASE 12: Create Placeholder Cache Files

### Step 12.1: Create Empty Cache Files

```bash
echo '[]' > src/content/cache/organizations.json
echo '[]' > src/content/cache/involvements.json
echo '[]' > src/content/cache/projects.json
echo '[]' > src/content/cache/skills.json
cat > src/content/cache/meta.json << 'EOF'
{
  "buildTime": "2024-01-01T00:00:00.000Z",
  "schemaVersion": "1.0.0"
}
EOF
```

---

## PHASE 13: Sync Notion Data

### Step 13.1: Run Notion Sync

```bash
bun run sync
```

**Expected output:**
```
Starting Notion sync...

Fetching organizations...
  Found X organizations
Fetching involvements...
  Found X involvements
Fetching projects...
  Found X projects
Fetching skills...
  Found X skills

Processing organizations...
Processing involvements...
Processing projects...
Processing skills...

Writing cache files...

Sync complete!
  Organizations: X
  Involvements: X
  Projects: X
  Skills: X
```

**If you get an error about Notion API**, check:
1. `.env.local` file exists with correct credentials
2. The Notion integration has access to all databases
3. Each database has a "Published" checkbox property

---

## PHASE 14: Test the Build

### Step 14.1: Build for Production

```bash
bun run build
```

**Expected output:** Build completes with pages generated.

### Step 14.2: Preview Production Build

```bash
bun run preview
```

Visit http://localhost:4321 in your browser.

### Step 14.3: Start Development Server

```bash
bun run dev
```

Visit http://localhost:4321 in your browser.

---

## PHASE 15: Commit and Push

```bash
git add -A
git commit -m "Complete project setup with Notion CMS integration"
git push origin main
```

---

## Troubleshooting

### Error: "Cannot find module '../content/cache/organizations.json'"

Run: `bun run sync`

### Error: "Notion credentials not configured"

Check that `.env.local` exists and has all 5 variables set.

### Error: "unauthorized" from Notion API

1. Check NOTION_TOKEN is correct
2. Check the integration is shared with all 4 databases in Notion

### Error: "Could not find database"

Check the database IDs are correct (32-character hex strings without dashes).

### Build succeeds but pages are empty

Check that your Notion databases have:
1. A "Published" checkbox property
2. At least one item with Published = true

---

## Quick Reference Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build |
| `bun run sync` | Sync Notion content |
| `bun run typecheck` | Check TypeScript |
| `bun run format` | Format code |

---

## File Checklist

After setup, you should have these files:

```
personal-site/
├── .env.local              ✓
├── .env.example            ✓
├── .gitignore              ✓
├── .nvmrc                  ✓
├── .prettierrc             ✓
├── astro.config.mjs        ✓
├── package.json            ✓
├── tsconfig.json           ✓
├── scripts/
│   └── notion-sync.ts      ✓
├── src/
│   ├── components/
│   │   └── panes/
│   │       └── PaneController.tsx  ✓
│   ├── content/
│   │   └── cache/
│   │       ├── organizations.json  ✓
│   │       ├── involvements.json   ✓
│   │       ├── projects.json       ✓
│   │       ├── skills.json         ✓
│   │       └── meta.json           ✓
│   ├── layouts/
│   │   └── Layout.astro    ✓
│   ├── lib/
│   │   ├── types.ts        ✓
│   │   └── contentStore.ts ✓
│   ├── pages/
│   │   ├── index.astro     ✓
│   │   ├── involvements/
│   │   │   └── [slug].astro ✓
│   │   ├── projects/
│   │   │   └── [slug].astro ✓
│   │   └── orgs/
│   │       └── [slug].astro ✓
│   └── styles/
│       └── global.css      ✓
└── public/
    └── notion-assets/      ✓ (empty dir)
```

