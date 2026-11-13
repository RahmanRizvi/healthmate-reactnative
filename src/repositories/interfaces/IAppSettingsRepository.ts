import { AppSettings, UpdateAppSettingsInput } from '../../models/AppSettings';

export interface IAppSettingsRepository {
  getSettings(): Promise<AppSettings>;
  updateSettings(input: UpdateAppSettingsInput): Promise<AppSettings>;
}
