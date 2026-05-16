export interface RefreshResponse {
  token: string;
  refreshToken: string;
  type: string;
  expiresIn: number;
}
