/**
 * Content Store
 *
 * Loads cached Notion content and provides indexed access.
 * This is used at build time by Astro pages.
 */

import type {
  Organization,
  Involvement,
  Project,
  Skill,
  ContentIndex,
  SyncMeta,
} from './types';

// Import JSON files (Astro handles this at build time)
import organizationsData from '../content/cache/organizations.json';
import involvementsData from '../content/cache/involvements.json';
import projectsData from '../content/cache/projects.json';
import skillsData from '../content/cache/skills.json';
import metaData from '../content/cache/meta.json';

// Type assertions for imported JSON
const organizations = organizationsData as Organization[];
const involvements = involvementsData as Involvement[];
const projects = projectsData as Project[];
const skills = skillsData as Skill[];
const meta = metaData as SyncMeta;

// Build indexes
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

// Exported indexes
export const organizationsIndex = buildIndex(organizations);
export const involvementsIndex = buildIndex(involvements);
export const projectsIndex = buildIndex(projects);
export const skillsIndex = buildIndex(skills);

// Convenience getters
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

// Filtered getters
export function getCurrentInvolvements(): Involvement[] {
  return involvements.filter((inv) => inv.current || !inv.dates.end);
}

export function getFeaturedProjects(): Project[] {
  return projects.filter(
    (p) => p.featured && p.involvements.length === 0
  );
}

export function getProjectsByInvolvement(involvementId: string): Project[] {
  return projects.filter((p) =>
    p.involvements.some((inv) => inv.id === involvementId)
  );
}

export function getInvolvementsByOrganization(orgId: string): Involvement[] {
  return involvements.filter((inv) => inv.organization.id === orgId);
}

// Export raw arrays for iteration
export { organizations, involvements, projects, skills, meta };

