import { UpsertUserProfileInput, UserProfile } from '../../models/UserProfile';

export interface IUserProfileRepository {
  getProfile(): Promise<UserProfile | null>;
  upsertProfile(input: UpsertUserProfileInput): Promise<UserProfile>;
}
