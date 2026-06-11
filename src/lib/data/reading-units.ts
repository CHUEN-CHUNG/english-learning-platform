export interface ReadingUnit {
  id: string;
  title: string;
  unitCode: string;
  unitNumber: string;
  paragraphs: number;
}

export const readingUnits: ReadingUnit[] = [
  { id: 'yle-1', title: 'Unit 1 (YLE-1)', unitCode: 'YLE-1', unitNumber: '1', paragraphs: 6 },
  { id: 'yle-2', title: 'Unit 2 (YLE-2)', unitCode: 'YLE-2', unitNumber: '2', paragraphs: 5 },
  { id: 'yle-3', title: 'Unit 3 (YLE-3)', unitCode: 'YLE-3', unitNumber: '3', paragraphs: 16 }
];
