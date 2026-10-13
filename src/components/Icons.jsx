import React from 'react';

const base = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const HomeIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />
  </svg>
);
export const CalendarIcon = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="5" width="16" height="15" rx="3" />
    <path d="M4 10h16M9 3v4M15 3v4" />
  </svg>
);
export const ChevronLeft = (p) => (
  <svg {...base} {...p}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);
export const ChevronRight = (p) => (
  <svg {...base} {...p}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);
export const CheckIcon = (p) => (
  <svg {...base} strokeWidth={3} {...p}>
    <path d="M5 12l5 5 9-10" />
  </svg>
);
export const CrossIcon = (p) => (
  <svg {...base} strokeWidth={3} {...p}>
    <path d="M7 7l10 10M17 7L7 17" />
  </svg>
);
export const ClockIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const PulseIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M4 17l4-8 4 6 3-4 5 6" />
  </svg>
);
