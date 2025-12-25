/**
 * Notion Sync Script
 *
 * This script fetches content from Notion databases and outputs
 * normalized JSON files for the static site to consume at build time.
 *
 * Usage: npm run sync
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local first, then .env
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
import { HttpsProxyAgent } from 'https-proxy-agent';

// Configure proxy if available (for corporate networks)
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
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

// Rate limiting: Notion allows ~3 req/sec average
const limit = pLimit(3);

// Output paths
const CACHE_DIR = path.join(process.cwd(), 'src/content/cache');
const ASSETS_DIR = path.join(process.cwd(), 'public/notion-assets');

// Environment validation
function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Initialize Notion client with proxy support
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
  fetch: agent
    ? (url: string, init?: RequestInit) => {
        return fetch(url, { ...init, agent } as any);
      }
    : undefined,
});

// Database IDs from environment
const DB_IDS = {
  organizations: process.env.NOTION_DB_ORGANIZATIONS_ID,
  involvements: process.env.NOTION_DB_INVOLVEMENTS_ID,
  projects: process.env.NOTION_DB_PROJECTS_ID,
  skills: process.env.NOTION_DB_SKILLS_ID,
} as const;

// Note: isFullPage and isFullBlock are imported from @notionhq/client

// Property extraction helpers
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

// Convert Notion rich text to our InlineToken format
function richTextToTokens(richText: RichTextItemResponse[]): InlineToken[] {
  return richText.map((item): InlineToken => {
    if (item.type === 'mention') {
      if (item.mention.type === 'page') {
        return {
          type: 'mention',
          label: item.plain_text,
          // entityType and slug will be resolved later
        };
      }
      // Other mention types (user, date, etc.) - render as text
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

    // Fallback for other types
    return { type: 'text', text: item.plain_text };
  });
}

// Fetch all blocks for a page
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
        // Fetch nested blocks if has_children
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

// Convert Notion blocks to our BlockNode format
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

// Extract sections from blocks based on headings
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

      // Save previous section if we were in one
      if (currentHeading) {
        sections[currentHeading] = currentBlocks;
      }

      // Check if this heading matches one we're looking for
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

  // Save last section
  if (currentHeading) {
    sections[currentHeading] = currentBlocks;
  }

  return sections;
}

// Generate a URL-safe slug from a title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Fetch all pages from a database
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

// Download an asset and return the local path
async function downloadAsset(url: string): Promise<string> {
  const hash = Buffer.from(url).toString('base64url').slice(0, 16);
  const ext = path.extname(new URL(url).pathname) || '.png';
  const filename = `${hash}${ext}`;
  const localPath = path.join(ASSETS_DIR, filename);

  try {
    // Check if already downloaded
    await fs.access(localPath);
    return `/notion-assets/${filename}`;
  } catch {
    // Download the file
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to download asset: ${url}`);
      return url; // Return original URL as fallback
    }

    const buffer = await response.arrayBuffer();
    await fs.writeFile(localPath, Buffer.from(buffer));
    return `/notion-assets/${filename}`;
  }
}

// Main sync function
async function sync() {
  console.log('Starting Notion sync...\n');

  // Ensure output directories exist
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.mkdir(ASSETS_DIR, { recursive: true });

  // Check if we have the required environment variables
  const hasNotionConfig = process.env.NOTION_TOKEN && DB_IDS.organizations;

  if (!hasNotionConfig) {
    console.log('Notion credentials not configured. Creating placeholder data...\n');

    // Create placeholder data for development
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
    console.log('To sync real data, set up your .env.local with Notion credentials.\n');
    return;
  }

  // Build ID maps for relation resolution
  const pageMap = new Map<
    string,
    { type: string; slug: string; title: string }
  >();

  // Fetch all databases
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

  // Build page map for relation resolution
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

  // Helper to resolve relations
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

  // Process organizations
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
        logo: undefined, // TODO: download from Files property
        url: getUrl(page, 'URL'),
        location: getRichText(page, 'Location'),
        involvements: resolveRefs(getRelationIds(page, 'Involvements')),
        context: blocksToNodes(blocks),
        icon: getIcon(page),
        cover: getCover(page),
      };
    })
  );

  // Process involvements
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

  // Process projects
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

  // Process skills
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

  // Write output files
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

// Run sync
sync().catch((error) => {
  console.error('Sync failed:', error);
  process.exit(1);
});

