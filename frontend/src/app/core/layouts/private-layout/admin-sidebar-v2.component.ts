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
import { SidebarItem } from './sidebar-item.model';

type AdminDomainId = 'overview' | 'operation' | 'people' | 'system';

type AdminDomain = {
  id: AdminDomainId;
  label: string;
  description: string;
  icon: string;
  items: SidebarItem[];
};

const DOMAIN_META: Array<Omit<AdminDomain, 'items'>> = [
  {
    id: 'overview',
    label: 'Vista general',
    description: 'Indicadores, actividad y control diario',
    icon: 'ti ti-layout-dashboard'
  },
  {
    id: 'operation',
    label: 'Operación',
    description: 'Plataformas, campañas y mantenimiento',
    icon: 'ti ti-adjustments-horizontal'
  },
  {
    id: 'people',
    label: 'Personas',
    description: 'Colaboradores, asistencia y empleabilidad',
    icon: 'ti ti-users-group'
  },
  {
    id: 'system',
    label: 'Configuración',
    description: 'Catálogos, equipos y administración',
    icon: 'ti ti-settings-2'
  }
];

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
  private lastRailTrigger?: HTMLElement;

  readonly items = input.required<SidebarItem[]>();
  readonly displayName = input('Usuario');
  readonly roleLabel = input('Administrador');
  readonly statusLabel = input('ONLINE');
  readonly statusColor = input('#37c676');
  readonly deleteLeadsVisible = input(false);
  readonly canCorrectMerito = input(false);

  readonly logoutRequested = output<void>();
  readonly correctMeritoRequested = output<void>();
  readonly deleteLeadsToggled = output<void>();

  protected readonly openPanelId = signal<AdminDomainId | 'profile' | null>(null);
  protected readonly selectedPath = signal<SidebarItem[]>([]);
  protected readonly currentUrl = signal(this.router.url);
  protected readonly currentDate = signal(new Date());
  protected readonly panelClickConfirmed = signal(false);
  protected readonly dateLabel = computed(() => ADMIN_DATE_FORMATTER.format(this.currentDate()));
  protected readonly timeLabel = computed(() => ADMIN_TIME_FORMATTER.format(this.currentDate()));

  protected readonly domains = computed<AdminDomain[]>(() =>
    DOMAIN_META.map((domain) => ({
      ...domain,
      items: this.items().filter((item) => this.domainFor(item) === domain.id)
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
        this.closePanel();
      });
  }

  ngOnDestroy(): void {
    if (this.breadcrumbScrollFrame !== undefined) cancelAnimationFrame(this.breadcrumbScrollFrame);
    if (this.clockTimer) clearInterval(this.clockTimer);
    this.cancelClose();
    this.cancelConfirmation();
  }

  @HostListener('document:keydown.escape')
  protected closeOnEscape(): void {
    this.closePanel(true);
  }

  protected openDomain(domain: AdminDomain, event?: Event): void {
    this.rememberRailTrigger(event);
    this.cancelClose();
    const activePath = this.findActivePath(domain.items);
    const groupPath = activePath.filter((item) => Boolean(item.children?.length));
    this.selectedPath.set(groupPath);
    this.openPanelId.set(domain.id);
    this.scrollBreadcrumbToEnd();
  }

  protected selectDomain(domain: AdminDomain, event?: Event): void {
    this.openDomain(domain, event);
    this.confirmPanelSelection();
  }

  protected openHome(event?: Event): void {
    const firstDomain = this.domains()[0];
    if (firstDomain) this.selectDomain(firstDomain, event);
  }

  protected openProfile(event?: Event): void {
    this.rememberRailTrigger(event);
    this.cancelClose();
    this.selectedPath.set([]);
    this.openPanelId.set('profile');
    this.confirmPanelSelection();
  }

  protected activateGroup(item: SidebarItem): void {
    if (!item.children?.length) return;
    this.selectedPath.update((path) => [...path, item]);
    this.scrollBreadcrumbToEnd();
  }

  protected navigateToLevel(level: number): void {
    this.selectedPath.update((path) => path.slice(0, level));
    this.scrollBreadcrumbToEnd();
  }

  protected scheduleClose(): void {
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
    this.openPanelId.set(null);
    this.selectedPath.set([]);
    if (restoreFocus) queueMicrotask(() => this.lastRailTrigger?.focus({ preventScroll: true }));
  }

  protected itemKey(item: SidebarItem): string {
    return item.key ?? item.route ?? item.label;
  }

  protected domainIsActive(domain: AdminDomain): boolean {
    return this.openPanelId() === domain.id || this.hasActiveRoute(domain.items);
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

  private domainFor(item: SidebarItem): AdminDomainId {
    const key = `${item.label} ${item.route ?? ''}`.toLocaleLowerCase('es');
    if (/dashboard|bitácora|bitacora|finanzas|leads.del.d[ií]a/.test(key)) return 'overview';
    if (/plataformas|correcci[oó]n|mantenimiento|operaciones/.test(key)) return 'operation';
    if (/colaboradores|asistencia|personal|empleabilidad/.test(key)) return 'people';
    return 'system';
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
