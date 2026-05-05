import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { STORAGE_KEYS } from '../constants/storage.constants';
import { SessionService } from './session.service';

type ActiveTabsRegistry = Record<string, number>;

@Injectable({
  providedIn: 'root'
})
export class BrowserSessionService {
  private readonly heartbeatIntervalMs = 15000;
  private readonly staleTabThresholdMs = 30000;
  private heartbeatTimerId: number | null = null;
  private tabId = '';

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly sessionService: SessionService
  ) {}

  initialize(): void {
    if (!this.isBrowser()) {
      return;
    }

    const existingTabId = sessionStorage.getItem(STORAGE_KEYS.tabId);
    this.tabId = existingTabId ?? this.createAndStoreTabId();

    this.registerCurrentTab();
    this.pruneStaleTabs();

    if (!existingTabId && this.getActiveTabCount() === 1) {
      this.sessionService.clearSession();
      this.registerCurrentTab();
    }

    this.startHeartbeat();

    window.addEventListener('beforeunload', this.handleTabClose);
    window.addEventListener('pagehide', this.handleTabClose);
  }

  private readonly handleTabClose = (): void => {
    this.stopHeartbeat();
    this.unregisterCurrentTab();
  };

  private registerCurrentTab(): void {
    const activeTabs = this.getActiveTabs();
    activeTabs[this.tabId] = Date.now();
    this.saveActiveTabs(activeTabs);
  }

  private unregisterCurrentTab(): void {
    const activeTabs = this.getActiveTabs();
    delete activeTabs[this.tabId];
    this.saveActiveTabs(activeTabs);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimerId = window.setInterval(() => {
      const activeTabs = this.getActiveTabs();

      if (!activeTabs[this.tabId]) {
        activeTabs[this.tabId] = Date.now();
      } else {
        activeTabs[this.tabId] = Date.now();
      }

      this.saveActiveTabs(activeTabs);
      this.pruneStaleTabs();
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimerId !== null) {
      window.clearInterval(this.heartbeatTimerId);
      this.heartbeatTimerId = null;
    }
  }

  private pruneStaleTabs(): void {
    const now = Date.now();
    const activeTabs = this.getActiveTabs();
    const freshTabs = Object.fromEntries(
      Object.entries(activeTabs).filter(([, lastSeen]) => now - lastSeen < this.staleTabThresholdMs)
    ) as ActiveTabsRegistry;

    this.saveActiveTabs(freshTabs);
  }

  private getActiveTabCount(): number {
    return Object.keys(this.getActiveTabs()).length;
  }

  private getActiveTabs(): ActiveTabsRegistry {
    const rawValue = localStorage.getItem(STORAGE_KEYS.activeTabs);

    if (!rawValue) {
      return {};
    }

    try {
      return JSON.parse(rawValue) as ActiveTabsRegistry;
    } catch {
      localStorage.removeItem(STORAGE_KEYS.activeTabs);
      return {};
    }
  }

  private saveActiveTabs(activeTabs: ActiveTabsRegistry): void {
    if (Object.keys(activeTabs).length === 0) {
      localStorage.removeItem(STORAGE_KEYS.activeTabs);
      return;
    }

    localStorage.setItem(STORAGE_KEYS.activeTabs, JSON.stringify(activeTabs));
  }

  private createAndStoreTabId(): string {
    const newTabId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    sessionStorage.setItem(STORAGE_KEYS.tabId, newTabId);
    return newTabId;
  }

  private isBrowser(): boolean {
    return !!this.document?.defaultView;
  }
}
