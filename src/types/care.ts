export type FacilityType =
  | 'nursing'
  | 'daycare'
  | 'hospital'
  | 'silvertown'
  | 'hospcare'
  | 'homecare';

export type EvalGrade = 'A' | 'B' | 'C' | 'D' | 'E' | '1' | '2' | '3' | '4' | '5' | 'NEW';
export type OwnershipType = '국공립' | '법인사업자' | '개인사업자';
export type ActiveTab = 'home' | 'map' | 'region' | 'calc' | 'guide';

export interface CareFacility {
  id: string;
  name: string;
  type: FacilityType;
  typeName: string;
  ownership: OwnershipType;
  grade: EvalGrade;
  score: number | null;
  evalYear: string;
  addr: string;
  sido: string;
  sigungu: string;
  lat: number;
  lng: number;
  tel: string;
  capacity: number | null;
  staffCare: number;
  staffNurse: number;
  staffDetail?: string;
  established: string;
  tags: string[];
}
