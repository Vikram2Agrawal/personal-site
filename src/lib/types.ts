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
  value: string; // Emoji char or local asset path
}

export interface DateRange {
  start: string;
  end?: string;
}

// Block content types for rich text
export interface InlineToken {
  type: 'text' | 'mention' | 'link' | 'code';
  text?: string;
  // For mentions:
  entityType?: 'skill' | 'project' | 'involvement' | 'organization';
  slug?: string;
  label?: string;
  // For links:
  url?: string;
  // For text styling:
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
  color?: string;
}

export interface BlockNode {
  type: string; // 'paragraph' | 'heading_1' | 'heading_2' | 'heading_3' | 'code' | 'bulleted_list_item' | 'numbered_list_item' | 'image' | etc.
  content?: InlineToken[]; // For text blocks
  children?: BlockNode[]; // For nested blocks
  // Block-specific props
  language?: string; // For code blocks
  url?: string; // For images
  caption?: InlineToken[]; // For images
}

// Main entity types
export interface Organization {
  id: string;
  slug: string;
  sharePath: string;
  name: string;
  published: boolean;
  type?: string; // "Company" | "School" | etc.
  logo?: string; // Local asset path
  url?: string;
  location?: string;
  involvements: ResolvedRef[];
  context: BlockNode[]; // Page body blocks
  icon?: Icon;
  cover?: string; // Local asset path
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
  type?: string; // "Full-time" | "Part-time" | "Contract" | etc.
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
  type?: string; // "Language" | "Framework" | "Tool" | etc.
  proficiency?: number; // 1-5
  relatedProjects: ResolvedRef[];
  relatedInvolvements: ResolvedRef[];
  context: BlockNode[]; // Page body for modal
  icon?: Icon;
}

// Metadata for cache
export interface SyncMeta {
  buildTime: string;
  schemaVersion: string;
}

// Content store index types
export interface ContentIndex<T> {
  all: T[];
  bySlug: Record<string, T>;
  byId: Record<string, T>;
}

// Pane state types for URL routing
export type PaneType = 'involvement' | 'project' | 'organization' | 'skill';

export interface PaneState {
  type: PaneType;
  slug: string;
}

