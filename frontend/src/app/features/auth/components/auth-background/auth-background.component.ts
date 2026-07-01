import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
  viewChildren
} from '@angular/core';
import { AuthBackgroundThemeService } from '../../services/auth-background-theme.service';

interface LeafConfig {
  size: number;
  top: string;
  delay: string;
  duration: string;
  opacity: number;
  hue: number;
}

interface StarConfig {
  size: number;
  top: string;
  left: string;
  delay: string;
  duration: string;
  opacity: number;
  glow: number;
}

@Component({
  selector: 'app-auth-background',
  templateUrl: './auth-background.component.html',
  styleUrl: './auth-background.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthBackgroundComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly themeService = inject(AuthBackgroundThemeService);
  private rafId = 0;
  private pendingEvent: MouseEvent | null = null;

  protected readonly theme = this.themeService.theme;
  protected readonly backgroundClass = computed(
    () => `auth-background--${this.theme()}`
  );
  protected readonly spotX = signal('50vw');
  protected readonly spotY = signal('50vh');

  protected readonly leafPosElements = viewChildren<ElementRef<HTMLDivElement>>('leafPos');
  protected readonly starElements = viewChildren<ElementRef<HTMLSpanElement>>('starEl');

  protected readonly leaves: readonly LeafConfig[] = [
    { size: 16, top: '8%', delay: '-1s', duration: '17s', opacity: 0.4, hue: 32 },
    { size: 24, top: '72%', delay: '-6s', duration: '21s', opacity: 0.5, hue: 36 },
    { size: 20, top: '34%', delay: '-12s', duration: '19s', opacity: 0.45, hue: 28 },
    { size: 30, top: '84%', delay: '-3s', duration: '24s', opacity: 0.55, hue: 40 },
    { size: 14, top: '48%', delay: '-9s', duration: '16s', opacity: 0.35, hue: 32 },
    { size: 26, top: '18%', delay: '-15s', duration: '22s', opacity: 0.5, hue: 30 },
    { size: 18, top: '58%', delay: '-5s', duration: '18s', opacity: 0.4, hue: 38 },
    { size: 22, top: '88%', delay: '-11s', duration: '20s', opacity: 0.45, hue: 34 },
    { size: 12, top: '24%', delay: '-18s', duration: '15s', opacity: 0.3, hue: 28 },
    { size: 28, top: '42%', delay: '-7s', duration: '23s', opacity: 0.5, hue: 36 },
    { size: 16, top: '66%', delay: '-14s', duration: '17s', opacity: 0.4, hue: 31 },
    { size: 20, top: '14%', delay: '-4s', duration: '19s', opacity: 0.45, hue: 38 },
    { size: 24, top: '52%', delay: '-10s', duration: '21s', opacity: 0.5, hue: 33 },
    { size: 14, top: '78%', delay: '-16s', duration: '16s', opacity: 0.35, hue: 29 }
  ];

  protected readonly stars: readonly StarConfig[] = [
    { size: 10, top: '12%', left: '8%', delay: '-0.5s', duration: '5s', opacity: 0.45, glow: 8 },
    { size: 14, top: '22%', left: '24%', delay: '-2s', duration: '6s', opacity: 0.5, glow: 12 },
    { size: 8, top: '8%', left: '42%', delay: '-1.2s', duration: '4.5s', opacity: 0.4, glow: 6 },
    { size: 12, top: '18%', left: '62%', delay: '-3s', duration: '5.5s', opacity: 0.5, glow: 10 },
    { size: 9, top: '15%', left: '82%', delay: '-1.8s', duration: '5s', opacity: 0.4, glow: 7 },
    { size: 16, top: '38%', left: '14%', delay: '-2.5s', duration: '6.5s', opacity: 0.55, glow: 14 },
    { size: 10, top: '48%', left: '38%', delay: '-0.8s', duration: '5s', opacity: 0.45, glow: 8 },
    { size: 13, top: '42%', left: '68%', delay: '-3.2s', duration: '6s', opacity: 0.5, glow: 11 },
    { size: 8, top: '55%', left: '88%', delay: '-1.5s', duration: '4.5s', opacity: 0.35, glow: 6 },
    { size: 11, top: '68%', left: '22%', delay: '-2.8s', duration: '5.5s', opacity: 0.45, glow: 9 },
    { size: 15, top: '62%', left: '52%', delay: '-1s', duration: '6s', opacity: 0.55, glow: 13 },
    { size: 9, top: '78%', left: '78%', delay: '-3.5s', duration: '5s', opacity: 0.4, glow: 7 },
    { size: 10, top: '85%', left: '32%', delay: '-0.5s', duration: '5.5s', opacity: 0.45, glow: 8 },
    { size: 12, top: '92%', left: '62%', delay: '-2.2s', duration: '6s', opacity: 0.5, glow: 10 },
    { size: 8, top: '88%', left: '12%', delay: '-1.8s', duration: '4.5s', opacity: 0.35, glow: 6 }
  ];

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = 0;
      }
    });
  }

  @HostListener('document:mousemove', ['$event'])
  protected onMouseMove(event: MouseEvent): void {
    this.pendingEvent = event;
    if (this.rafId) {
      return;
    }

    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      const ev = this.pendingEvent;
      if (ev) {
        this.processMouseMove(ev);
      }
    });
  }

  private processMouseMove(event: MouseEvent): void {
    this.spotX.set(`${event.clientX}px`);
    this.spotY.set(`${event.clientY}px`);

    if (this.theme() === 'day') {
      this.processLeaves(event);
      return;
    }

    this.processStars(event);
  }

  private processLeaves(event: MouseEvent): void {
    const cx = event.clientX;
    const cy = event.clientY;
    const maxDist = 220;

    for (const ref of this.leafPosElements()) {
      const posEl = ref.nativeElement;
      const rect = posEl.getBoundingClientRect();
      const leafCx = rect.left + rect.width / 2;
      const leafCy = rect.top + rect.height / 2;
      const dx = leafCx - cx;
      const dy = leafCy - cy;
      const dist = Math.hypot(dx, dy);
      const pushEl = posEl.querySelector<HTMLElement>('.auth-leaf-push');

      if (!pushEl) {
        continue;
      }

      if (dist < maxDist && dist > 0.01) {
        const force = (1 - dist / maxDist) * 70;
        pushEl.style.setProperty('--push-x', `${(dx / dist) * force}px`);
        pushEl.style.setProperty('--push-y', `${(dy / dist) * force}px`);
      } else {
        pushEl.style.setProperty('--push-x', '0px');
        pushEl.style.setProperty('--push-y', '0px');
      }
    }
  }

  private processStars(event: MouseEvent): void {
    const cx = event.clientX;
    const cy = event.clientY;
    const glowMaxDist = 200;

    for (const ref of this.starElements()) {
      const el = ref.nativeElement;
      const rect = el.getBoundingClientRect();
      const starCx = rect.left + rect.width / 2;
      const starCy = rect.top + rect.height / 2;
      const dist = Math.hypot(starCx - cx, starCy - cy);

      if (dist < glowMaxDist && dist > 0.01) {
        const raw = 1 - dist / glowMaxDist;
        const intensity = raw * raw * (3 - 2 * raw);
        el.style.setProperty('--glow-intensity', `${intensity}`);
      } else {
        el.style.setProperty('--glow-intensity', '0');
      }
    }
  }
}
