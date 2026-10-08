import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { STORAGE_KEYS } from '../constants/storage.constants';
import { BrowserSessionService } from './browser-session.service';

interface AppVersionManifest {
  version?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppVersionService {
  private readonly versionUrl = '/version.json';
  private readonly checkIntervalMs = 30000;
  private readonly firstCheckDelayMs = 5000;
  private readonly recoveryReloadKey = 'albru_asset_recovery_reload_at';
  private readonly recoveryCooldownMs = 30000;
  private checkTimerId: number | null = null;
  private isReloading = false;
  private currentVersion = '';

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly browserSessionService: BrowserSessionService
  ) {}

  initialize(): void {
    if (!this.isBrowser()) {
      return;
    }

    this.installAssetLoadRecovery();

    if (!environment.production) {
      return;
    }

    this.currentVersion = localStorage.getItem(STORAGE_KEYS.appVersion) ?? '';

    window.setTimeout(() => void this.checkForNewVersion(), this.firstCheckDelayMs);
    this.checkTimerId = window.setInterval(
      () => void this.checkForNewVersion(),
      this.checkIntervalMs
    );
  }

  private async checkForNewVersion(): Promise<void> {
    if (this.isReloading) {
      return;
    }

    const manifest = await this.fetchVersionManifest();

    if (!manifest?.version) {
      return;
    }

    if (!this.currentVersion) {
      this.rememberVersion(manifest.version);
      return;
    }

    if (manifest.version === this.currentVersion) {
      return;
    }

    this.reloadApplication(manifest.version);
  }

  private async fetchVersionManifest(): Promise<AppVersionManifest | null> {
    try {
      const response = await fetch(`${this.versionUrl}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as AppVersionManifest;
    } catch {
      return null;
    }
  }

  private reloadApplication(nextVersion: string): void {
    this.isReloading = true;
    this.rememberVersion(nextVersion);

    if (this.checkTimerId !== null) {
      window.clearInterval(this.checkTimerId);
      this.checkTimerId = null;
    }

    this.browserSessionService.allowExternalNavigation();
    this.reloadWithCacheBust(nextVersion);
  }

  private rememberVersion(version: string): void {
    this.currentVersion = version;
    localStorage.setItem(STORAGE_KEYS.appVersion, version);
  }

  private isBrowser(): boolean {
    return !!this.document?.defaultView;
  }

  private installAssetLoadRecovery(): void {
    const windowRef = this.document.defaultView;
    if (!windowRef) {
      return;
    }

    windowRef.addEventListener('error', (event) => {
      if (this.isRecoverableAssetLoadEvent(event)) {
        this.reloadAfterAssetLoadFailure();
      }
    }, true);

    windowRef.addEventListener('unhandledrejection', (event) => {
      if (this.isRecoverableAssetLoadError(event.reason)) {
        this.reloadAfterAssetLoadFailure();
      }
    });
  }

  private reloadAfterAssetLoadFailure(): void {
    if (this.isReloading) {
      return;
    }

    const lastReload = Number(sessionStorage.getItem(this.recoveryReloadKey) ?? 0);
    if (Number.isFinite(lastReload) && Date.now() - lastReload < this.recoveryCooldownMs) {
      return;
    }

    this.isReloading = true;
    sessionStorage.setItem(this.recoveryReloadKey, String(Date.now()));
    this.browserSessionService.allowExternalNavigation();
    this.reloadWithCacheBust(`asset-${Date.now()}`);
  }

  private reloadWithCacheBust(version: string): void {
    const windowRef = this.document.defaultView;
    if (!windowRef) {
      return;
    }

    const url = new URL(windowRef.location.href);
    url.searchParams.set('_albru_v', version);
    windowRef.location.replace(url.toString());
  }

  private isRecoverableAssetLoadEvent(event: Event): boolean {
    const target = event.target;
    if (target instanceof HTMLScriptElement) {
      return this.isLocalAssetUrl(target.src);
    }
    if (target instanceof HTMLLinkElement && target.rel === 'stylesheet') {
      return this.isLocalAssetUrl(target.href);
    }
    return false;
  }

  private isRecoverableAssetLoadError(error: unknown): boolean {
    const value = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '');
    return /ChunkLoadError|Loading chunk|dynamically imported module|module script failed|Failed to fetch/i.test(value);
  }

  private isLocalAssetUrl(value: string): boolean {
    try {
      const url = new URL(value, this.document.defaultView?.location.origin);
      if (url.origin !== this.document.defaultView?.location.origin) {
        return false;
      }
      return /\.(js|css)($|\?)/i.test(url.pathname);
    } catch {
      return false;
    }
  }
}
