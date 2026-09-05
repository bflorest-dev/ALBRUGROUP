import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { SidebarDomainDefinition, SidebarItem, SidebarProviderOption } from './sidebar-item.model';

type SidebarDomain = SidebarDomainDefinition & {
  items: SidebarItem[];
};

const ADMIN_DATE_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  weekday: 'short'
});

const ADMIN_TIME_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  hour: '2-digit',
  hour12: false,
  minute: '2-digit',
  second: '2-digit'
});

const HOVER_OPEN_DELAY_MS = 200;

@Component({
  selector: 'app-admin-sidebar-v2',
  imports: [RouterLink, RouterLinkActive, BadgeModule, TooltipModule],
  templateUrl: './admin-sidebar-v2.component.html',
  styleUrl: './admin-sidebar-v2.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminSidebarV2Component implements OnDestroy {
  @ViewChild('breadcrumbs') private breadcrumbs?: ElementRef<HTMLElement>;

  private readonly router = inject(Router);
  private breadcrumbScrollFrame?: number;
  private clockTimer?: ReturnType<typeof setInterval>;
  private closeTimer?: ReturnType<typeof setTimeout>;
  private confirmationTimer?: ReturnType<typeof setTimeout>;
  private confirmationFrame?: number;
  private hoverOpenTimer?: ReturnType<typeof setTimeout>;
  private lastRailTrigger?: HTMLElement;

  readonly items = input.required<SidebarItem[]>();
  readonly domainDefinitions = input.required<SidebarDomainDefinition[]>();
  readonly displayName = input('Usuario');
  readonly roleLabel = input('Administrador');
  readonly statusLabel = input('ONLINE');
  readonly statusColor = input('#37c676');
  readonly deleteLeadsVisible = input(false);
  readonly showDeleteLeadsAction = input(false);
  readonly canCorrectMerito = input(false);
  readonly providers = input<SidebarProviderOption[]>([]);
  readonly activeProviderId = input<number | null>(null);

  readonly logoutRequested = output<void>();
  readonly correctMeritoRequested = output<void>();
  readonly deleteLeadsToggled = output<void>();
  readonly providerSelected = output<number>();

  protected readonly openPanelId = signal<string | 'profile' | null>(null);
  protected readonly selectedPath = signal<SidebarItem[]>([]);
  protected readonly committedDomainId = signal<string | null>(null);
  private readonly committedPath = signal<SidebarItem[]>([]);
  protected readonly currentUrl = signal(this.router.url);
  protected readonly currentDate = signal(new Date());
  protected readonly panelClickConfirmed = signal(false);
  protected readonly dateLabel = computed(() => ADMIN_DATE_FORMATTER.format(this.currentDate()));
  protected readonly timeLabel = computed(() => ADMIN_TIME_FORMATTER.format(this.currentDate()));

  protected readonly domains = computed<SidebarDomain[]>(() =>
    this.domainDefinitions().map((domain, index) => ({
      ...domain,
      items: this.items().filter((item) => item.domainId === domain.id || (!item.domainId && index === 0))
    })).filter((domain) => domain.items.length > 0)
  );

  protected readonly currentDomain = computed(() => {
    const openId = this.openPanelId();
    if (openId && openId !== 'profile') {
      return this.domains().find((domain) => domain.id === openId) ?? null;
    }
    return this.domains().find((domain) => this.hasActiveRoute(domain.items)) ?? this.domains()[0] ?? null;
  });

  protected readonly visibleItems = computed(() => {
    const path = this.selectedPath();
    return path.at(-1)?.children ?? this.currentDomain()?.items ?? [];
  });

  protected readonly isPanelOpen = computed(() => this.openPanelId() !== null);
  protected readonly isProfileOpen = computed(() => this.openPanelId() === 'profile');

  constructor() {
    this.clockTimer = setInterval(() => this.currentDate.set(new Date()), 1000);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        this.syncCommittedContextWithRoute();
        this.closePanel();
      });
  }

  ngOnDestroy(): void {
    if (this.breadcrumbScrollFrame !== undefined) cancelAnimationFrame(this.breadcrumbScrollFrame);
    if (this.clockTimer) clearInterval(this.clockTimer);
    this.cancelClose();
    this.cancelHoverOpen();
    this.cancelConfirmation();
  }

  @HostListener('document:keydown.escape')
  protected closeOnEscape(): void {
    this.closePanel(true);
  }

  protected openDomain(domain: SidebarDomain, event?: Event): void {
    this.rememberRailTrigger(event);
    this.cancelClose();
    const committedDomainId = this.committedDomainId();
    if (committedDomainId && committedDomainId !== domain.id) return;

    const showDomain = () => {
      const path = committedDomainId === domain.id ? this.committedPath() : this.activeGroupPath(domain);
      this.showDomain(domain, path);
    };

    if (event?.type === 'mouseenter' && !this.isPanelOpen()) {
      this.scheduleHoverOpen(showDomain);
      return;
    }

    this.cancelHoverOpen();
    showDomain();
  }

  protected selectDomain(domain: SidebarDomain, event?: Event): void {
    this.rememberRailTrigger(event);
    this.cancelClose();
    this.cancelHoverOpen();
    const path = this.activeGroupPath(domain);
    this.commitContext(domain.id, path);
    this.showDomain(domain, path);
    this.confirmPanelSelection();
  }

  protected openRail(): void {
    this.cancelClose();
    if (this.isPanelOpen()) return;

    this.scheduleHoverOpen(() => {
      const committedDomainId = this.committedDomainId();
      const domain =
        this.domains().find((candidate) => candidate.id === committedDomainId) ??
        this.domains().find((candidate) => this.hasActiveRoute(candidate.items)) ??
        this.domains()[0];
      if (!domain) return;

      const path = committedDomainId === domain.id ? this.committedPath() : this.activeGroupPath(domain);
      this.showDomain(domain, path);
    });
  }

  protected resumeRailOpenIntent(): void {
    if (!this.isPanelOpen()) this.openRail();
  }

  protected openHome(event?: Event): void {
    const firstDomain = this.domains()[0];
    if (firstDomain) this.selectDomain(firstDomain, event);
  }

  protected openProfile(event?: Event): void {
    this.rememberRailTrigger(event);
    this.cancelClose();
    this.cancelHoverOpen();
    this.selectedPath.set([]);
    this.openPanelId.set('profile');
    this.confirmPanelSelection();
  }

  protected activateGroup(item: SidebarItem): void {
    if (!item.children?.length) return;
    const path = [...this.selectedPath(), item];
    this.selectedPath.set(path);
    const domain = this.currentDomain();
    if (domain) this.commitContext(domain.id, path);
    this.scrollBreadcrumbToEnd();
  }

  protected navigateToLevel(level: number): void {
    const path = this.selectedPath().slice(0, level);
    this.selectedPath.set(path);
    const domain = this.currentDomain();
    if (domain && this.committedDomainId() === domain.id) this.committedPath.set(path);
    this.scrollBreadcrumbToEnd();
  }

  protected commitCurrentContext(): void {
    const domain = this.currentDomain();
    if (domain) this.commitContext(domain.id, this.selectedPath());
  }

  protected selectRoute(): void {
    this.commitCurrentContext();
    // Router no emite NavigationEnd al seleccionar de nuevo la misma URL. Cerramos el panel desde
    // la intencion del usuario para que todas las rutas finales tengan una respuesta determinista.
    this.closePanel();
  }

  protected scheduleClose(): void {
    this.cancelHoverOpen();
    this.cancelClose();
    this.closeTimer = setTimeout(() => this.closePanel(), 180);
  }

  protected cancelClose(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = undefined;
    }
  }

  protected closePanel(restoreFocus = false): void {
    this.cancelClose();
    this.cancelHoverOpen();
    this.openPanelId.set(null);
    this.selectedPath.set([]);
    if (restoreFocus) queueMicrotask(() => this.lastRailTrigger?.focus({ preventScroll: true }));
  }

  protected itemKey(item: SidebarItem): string {
    return item.key ?? item.route ?? item.label;
  }

  protected domainIsActive(domain: SidebarDomain): boolean {
    const openPanelId = this.openPanelId();
    if (openPanelId && openPanelId !== 'profile') return openPanelId === domain.id;
    return this.hasActiveRoute(domain.items);
  }

  protected itemIsActive(item: SidebarItem): boolean {
    if (item.route && this.routeMatches(item)) return true;
    return Boolean(item.children?.some((child) => this.itemIsActive(child)));
  }

  protected selectProfileAction(action: 'delete' | 'merito' | 'logout'): void {
    if (action === 'delete') {
      this.deleteLeadsToggled.emit();
      return;
    }
    this.closePanel();
    if (action === 'merito') this.correctMeritoRequested.emit();
    if (action === 'logout') this.logoutRequested.emit();
  }

  protected selectProvider(providerId: number): void {
    this.providerSelected.emit(providerId);
    this.closePanel();
  }

  private hasActiveRoute(items: SidebarItem[]): boolean {
    return items.some((item) => this.itemIsActive(item));
  }

  private routeMatches(item: SidebarItem): boolean {
    if (!item.route) return false;
    return item.exact
      ? this.currentUrl() === item.route || this.currentUrl().startsWith(`${item.route}?`)
      : this.currentUrl().startsWith(item.route);
  }

  private findActivePath(items: SidebarItem[]): SidebarItem[] {
    for (const item of items) {
      if (item.route && this.routeMatches(item)) return [item];
      if (item.children?.length) {
        const childPath = this.findActivePath(item.children);
        if (childPath.length) return [item, ...childPath];
      }
    }
    return [];
  }

  private activeGroupPath(domain: SidebarDomain): SidebarItem[] {
    return this.findActivePath(domain.items).filter((item) => Boolean(item.children?.length));
  }

  private showDomain(domain: SidebarDomain, path: SidebarItem[]): void {
    this.selectedPath.set(path);
    this.openPanelId.set(domain.id);
    this.scrollBreadcrumbToEnd();
  }

  private commitContext(domainId: string, path: SidebarItem[]): void {
    this.committedDomainId.set(domainId);
    this.committedPath.set(path);
  }

  private syncCommittedContextWithRoute(): void {
    if (!this.committedDomainId()) return;
    const activeDomain = this.domains().find((domain) => this.hasActiveRoute(domain.items));
    if (activeDomain) this.commitContext(activeDomain.id, this.activeGroupPath(activeDomain));
  }

  private scheduleHoverOpen(open: () => void): void {
    this.cancelHoverOpen();
    this.hoverOpenTimer = setTimeout(() => {
      this.hoverOpenTimer = undefined;
      open();
    }, HOVER_OPEN_DELAY_MS);
  }

  protected cancelHoverOpen(): void {
    if (this.hoverOpenTimer) {
      clearTimeout(this.hoverOpenTimer);
      this.hoverOpenTimer = undefined;
    }
  }

  private confirmPanelSelection(): void {
    this.cancelConfirmation();
    this.panelClickConfirmed.set(false);
    this.confirmationFrame = requestAnimationFrame(() => {
      this.confirmationFrame = requestAnimationFrame(() => {
        this.confirmationFrame = undefined;
        this.panelClickConfirmed.set(true);
        this.confirmationTimer = setTimeout(() => {
          this.panelClickConfirmed.set(false);
          this.confirmationTimer = undefined;
        }, 720);
      });
    });
  }

  private cancelConfirmation(): void {
    if (this.confirmationFrame !== undefined) {
      cancelAnimationFrame(this.confirmationFrame);
      this.confirmationFrame = undefined;
    }
    if (this.confirmationTimer) {
      clearTimeout(this.confirmationTimer);
      this.confirmationTimer = undefined;
    }
  }

  private rememberRailTrigger(event?: Event): void {
    if (event?.currentTarget instanceof HTMLElement) this.lastRailTrigger = event.currentTarget;
  }

  private scrollBreadcrumbToEnd(): void {
    if (this.breadcrumbScrollFrame !== undefined) cancelAnimationFrame(this.breadcrumbScrollFrame);
    this.breadcrumbScrollFrame = requestAnimationFrame(() => {
      this.breadcrumbScrollFrame = undefined;
      const breadcrumbs = this.breadcrumbs?.nativeElement;
      if (breadcrumbs) breadcrumbs.scrollLeft = breadcrumbs.scrollWidth;
    });
  }
}
