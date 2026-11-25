import { CareFacility } from '../types/care';

export function getGradeLabel(f: CareFacility, short = false): string {
  if (f.type === 'hospital') return short ? '병원' : '심평원 등록';
  if (f.grade !== 'NEW') return short ? `${f.grade}등급` : `공단 ${f.grade}등급`;
  const yr = parseInt((f.established || '').slice(0, 4), 10);
  if (!isNaN(yr) && yr >= 2024) return short ? '신설' : '신설기관';
  return short ? '미평가' : '평가 미실시';
}
