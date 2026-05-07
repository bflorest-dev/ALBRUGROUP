export {};

declare global {
  interface Window {
    __APP_CONFIG__?: Record<string, unknown>;
    clearAllStorage?: () => void;
    gtag?: (...args: unknown[]) => void;
  }
}
