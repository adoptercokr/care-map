export const FACILITY_ICON_META: Record<string, { color: string; svg: string }> = {
  hospital: {
    color: '#e11d48',
    svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><rect x="9.5" y="3" width="5" height="18" rx="1.5"/><rect x="3" y="9.5" width="18" height="5" rx="1.5"/></svg>',
  },
  nursing: {
    color: '#0e8a8d',
    svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
  },
  daycare: {
    color: '#0284c7',
    svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2"/></svg>',
  },
  homecare: {
    color: '#0d9488',
    svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.3"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
  },
  silvertown: {
    color: '#6366f1',
    svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1"/></svg>',
  },
};
