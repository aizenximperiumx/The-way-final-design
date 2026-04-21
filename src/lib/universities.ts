export type UniversityOption = { id: string; name: string };

export const UNIVERSITY_OPTIONS: UniversityOption[] = [
  { id: 'tbilisi-open-university', name: 'Tbilisi Open University' },
  { id: 'geomedi', name: 'Teaching University Geomedi' },
  { id: 'san-diego-state-university', name: 'San Diego State University' },
  { id: 'grigol-robakidze-university', name: 'Grigol Robakidze University' },
  { id: 'georgian-american-university', name: 'Georgian American University' },
];

export function getUniversityName(id?: string): string {
  if (!id) return '';
  return UNIVERSITY_OPTIONS.find(u => u.id === id)?.name ?? id;
}
