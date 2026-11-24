export type FacilityType =
  | 'nursing'
  | 'daycare'
  | 'hospital'
  | 'silvertown'
  | 'hospcare'
  | 'homecare';

export type EvalGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'NEW';
export type OwnershipType = '공립' | '법인' | '개인';
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
  capacity: number;
  current: number;
  waiting: number;
  staffCare: number;
  staffNurse: number;
  mealCost: number;
  room1Cost: number;
  room2Cost: number;
  monthlyBaseEstimate: number;
  established: string;
  tags: string[];
}
