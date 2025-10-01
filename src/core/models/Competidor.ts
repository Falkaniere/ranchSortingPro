export type RiderCategory = 'Open' | 'Amateur19' | 'AmateurLight' | 'Beginner'; // Principiante

export interface Competitor {
  id: string;
  name: string;
  category: RiderCategory;
  // Number of passes (rounds) this competitor must ride in the qualifier stage
  passes: number;
}
