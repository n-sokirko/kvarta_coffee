'use client';

import type { CSSProperties, ReactNode } from 'react';
import { pickInterest } from '@/lib/bus';

/** Ссылка на форму, которая заранее выбирает «что интересует». */
export function PickLink({ interest, className, style, children, onlyIfEmpty }: {
  interest: 'subscription' | 'order' | 'question';
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  onlyIfEmpty?: boolean;
}) {
  return (
    <a className={className} style={style} href="#lead" onClick={() => pickInterest(interest, !!onlyIfEmpty)}>
      {children}
    </a>
  );
}
