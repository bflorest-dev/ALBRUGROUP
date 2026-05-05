export type LoginFormData = {
  email: string;
  password: string;
};

/**
 * UI form model uses `email` for the input field, but the backend contract
 * still expects `username` when the request is sent.
 */
export interface LoginCredentials {
  username: string;
  password: string;
}
