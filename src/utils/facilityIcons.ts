export const FACILITY_ICON_META: Record<string, { color: string; svg: string }> = {
  hospital: {
    // 요양병원: 십자가(+)
    color: '#e11d48',
    svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><rect x="9.5" y="3" width="5" height="18" rx="1.5"/><rect x="3" y="9.5" width="18" height="5" rx="1.5"/></svg>',
  },
  nursing: {
    // 요양원: 다층 요양시설 건물 모양
    color: '#0e8a8d',
    svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/></svg>',
  },
  daycare: {
    // 주간보호센터: 낮 시간 통원 돌봄을 뜻하는 시계 아이콘
    color: '#0284c7',
    svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>',
  },
  homecare: {
    // 집간병·방문요양: 방문 돌봄 인력(사람)
    color: '#0d9488',
    svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
  },
  silvertown: {
    // 실버타운·양로원: 따뜻한 주거용 집 모양
    color: '#6366f1',
    svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
  },
};
