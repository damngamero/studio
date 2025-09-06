export interface Plant {
  id: string;
  customName: string;
  photoUrl: string; // data URI
  commonName: string;
  latinName: string;
  notes?: string;
  careTips?: string;
}
