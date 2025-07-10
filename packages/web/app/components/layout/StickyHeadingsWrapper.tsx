'use client';

import React, { useEffect, useRef, useState } from 'react';
import { StickyHeadings } from '../ui/StickyHeadings';

interface StickyHeadingsWrapperProps {
  children: React.ReactNode;
  /**
   * Enable sticky headings feature
   */
  enabled?: boolean;
  /**
   * Top offset for sticky headings (height of any fixed headers)
   */
  topOffset?: number;
  /**
   * CSS selector for the scrollable container
   */
  scrollContainerSelector?: string;
  /**
   * CSS selector for headings to track
   */
  headingSelector?: string;
}

export function StickyHeadingsWrapper({
  children,
  enabled = true,
  topOffset = 48,
  scrollContainerSelector = '.page-content',
  headingSelector = 'h1, h2, h3, h4, h5, h6',
}: StickyHeadingsWrapperProps) {
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    // Find the scroll container
    const container = document.querySelector(scrollContainerSelector) as HTMLElement;
    setScrollContainer(container);
  }, [enabled, scrollContainerSelector]);

  return (
    <div ref={contentRef}>
      {children}
      {enabled && (
        <StickyHeadings
          scrollContainer={scrollContainer}
          headingSelector={headingSelector}
          topOffset={topOffset}
          enabled={enabled}
        />
      )}
    </div>
  );
}
