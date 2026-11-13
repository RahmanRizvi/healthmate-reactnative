export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export interface UserProfile {
  id: number;
  full_name: string;
  date_of_birth: string; // YYYY-MM-DD
  gender: Gender;
  height_cm: number;
  weight_kg: number;
  created_at: string;
  updated_at: string;
}

export interface UpsertUserProfileInput {
  full_name: string;
  date_of_birth: string;
  gender: Gender;
  height_cm: number;
  weight_kg: number;
}
