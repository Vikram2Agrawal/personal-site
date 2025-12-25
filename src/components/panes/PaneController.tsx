/**
 * PaneController
 *
 * React island that manages pane (modal/sheet) state and URL synchronization.
 * Handles deep-linking: opening panes from URL params and updating URL on navigation.
 */

import { useState, useEffect, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { PaneState, PaneType } from '../../lib/types';

interface PaneControllerProps {
  initialPane?: PaneState | null;
}

export default function PaneController({ initialPane }: PaneControllerProps) {
  const [pane, setPane] = useState<PaneState | null>(initialPane || null);
  const [isOpen, setIsOpen] = useState(!!initialPane);

  // Sync URL when pane changes (client-side navigation)
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

  // Handle browser back/forward
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

  // Listen for custom events to open panes (from card clicks)
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

  // Render pane content based on type
  const renderPaneContent = () => {
    if (!pane) return null;

    // Placeholder content - will be replaced with actual pane components
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
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed right-0 top-0 h-full w-full max-w-2xl bg-[var(--color-bg)] border-l border-[var(--color-border)] shadow-2xl z-50 overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300">
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

// Helper to dispatch pane open events from anywhere
export function openPane(type: PaneType, slug: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('openPane', { detail: { type, slug } })
    );
  }
}

