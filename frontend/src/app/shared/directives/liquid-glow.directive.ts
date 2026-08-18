import { Directive, HostListener, OnDestroy } from '@angular/core';

const TRACKABLE_SELECTORS = [
  '.p-select',
  '.p-multiselect',
  'button.p-button',
  '.p-inputtext',
  'textarea',
  'input'
];

@Directive({
  selector: '[appLiquidGlow]',
  standalone: true
})
export class LiquidGlowDirective implements OnDestroy {
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  private frameId: number | null = null;
  private activeElement: HTMLElement | null = null;
  private pendingTarget: HTMLElement | null | undefined;
  private pendingEvent: PointerEvent | null = null;

  @HostListener('pointermove', ['$event'])
  protected onPointerMove(event: PointerEvent): void {
    if (this.reducedMotion.matches) {
      return;
    }

    const origin = event.target instanceof HTMLElement ? event.target : null;
    this.pendingTarget = origin ? this.resolveTarget(origin) : null;
    this.pendingEvent = event;

    if (this.frameId !== null) {
      return;
    }

    this.frameId = requestAnimationFrame(() => {
      this.frameId = null;
      const target = this.pendingTarget ?? null;
      const pointerEvent = this.pendingEvent;
      this.pendingTarget = undefined;
      this.pendingEvent = null;
      if (pointerEvent) {
        this.applyGlow(target, pointerEvent);
      }
    });
  }

  @HostListener('pointerleave')
  protected onPointerLeave(): void {
    this.clearGlow();
  }

  ngOnDestroy(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
    }
    this.clearGlow();
  }

  private resolveTarget(origin: HTMLElement): HTMLElement | null {
    for (const selector of TRACKABLE_SELECTORS) {
      const match = origin.closest<HTMLElement>(selector);
      if (match && !this.isDisabled(match)) {
        return match;
      }
    }
    return null;
  }

  private applyGlow(target: HTMLElement | null, event: PointerEvent): void {
    if (this.activeElement && this.activeElement !== target) {
      this.removeGlow(this.activeElement);
    }

    this.activeElement = target;
    if (!target) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const angle = (Math.atan2(y - rect.height / 2, x - rect.width / 2) * 180) / Math.PI;

    target.style.setProperty('--glow-x', `${x}px`);
    target.style.setProperty('--glow-y', `${y}px`);
    target.style.setProperty('--glow-angle', `${angle}deg`);
  }

  private clearGlow(): void {
    if (this.activeElement) {
      this.removeGlow(this.activeElement);
    }
    this.activeElement = null;
    this.pendingTarget = undefined;
    this.pendingEvent = null;
  }

  private removeGlow(element: HTMLElement): void {
    element.style.removeProperty('--glow-x');
    element.style.removeProperty('--glow-y');
    element.style.removeProperty('--glow-angle');
  }

  private isDisabled(element: HTMLElement): boolean {
    return (
      element.matches(':disabled') ||
      element.getAttribute('aria-disabled') === 'true' ||
      element.closest('.p-disabled') !== null
    );
  }
}
