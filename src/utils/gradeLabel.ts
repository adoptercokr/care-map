import { CareFacility } from '../types/care';

export function getGradeLabel(f: CareFacility, short = false): string {
  if (f.type === 'hospital') {
    if (f.grade !== 'NEW') return short ? `${f.grade}등급` : `병원평가 ${f.grade}등급`;
    return short ? '병원' : '의료기관(요양병원)';
  }
  if (f.type === 'silvertown') {
    return short ? '주거' : '노인주거복지시설';
  }
  if (f.grade !== 'NEW') return short ? `${f.grade}등급` : `장기요양 ${f.grade}등급`;
  const yr = parseInt((f.established || '').slice(0, 4), 10);
  if (!isNaN(yr) && yr >= 2024) return short ? '신설' : '신설기관';
  return short ? '미평가' : '평가 미실시';
}
