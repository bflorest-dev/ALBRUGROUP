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
  private checkTimerId: number | null = null;
  private isReloading = false;
  private currentVersion = '';

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly browserSessionService: BrowserSessionService
  ) {}

  initialize(): void {
    if (!environment.production || !this.isBrowser()) {
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
    window.location.reload();
  }

  private rememberVersion(version: string): void {
    this.currentVersion = version;
    localStorage.setItem(STORAGE_KEYS.appVersion, version);
  }

  private isBrowser(): boolean {
    return !!this.document?.defaultView;
  }
}
