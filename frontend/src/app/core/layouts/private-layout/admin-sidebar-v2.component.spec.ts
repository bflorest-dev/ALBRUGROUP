import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminSidebarV2Component } from './admin-sidebar-v2.component';
import { AttendanceActionOption } from '../../../shared/models/schedule/estado-asistencia';
import { SidebarDomainDefinition, SidebarItem } from './sidebar-item.model';

describe('AdminSidebarV2Component', () => {
  const items: SidebarItem[] = [
    {
      domainId: 'operation',
      label: 'Plataformas',
      icon: 'ti ti-apps',
      children: [
        {
          label: 'WinTeam',
          icon: 'ti ti-building',
          children: [
            {
              label: 'Backoffice',
              icon: 'ti ti-briefcase',
              children: [{ label: 'Seguimiento', route: '/seguimiento', icon: 'ti ti-list' }]
            }
          ]
        }
      ]
    }
  ];
  const domains: SidebarDomainDefinition[] = [
    {
      id: 'operation',
      label: 'Operación',
      description: 'Plataformas y seguimiento',
      icon: 'ti ti-adjustments-horizontal'
    }
  ];
  const multiDomainItems: SidebarItem[] = [
    ...items,
    {
      domainId: 'system',
      label: 'Usuarios',
      route: '/usuarios',
      icon: 'ti ti-users'
    }
  ];
  const multiDomains: SidebarDomainDefinition[] = [
    ...domains,
    {
      id: 'system',
      label: 'Sistema',
      description: 'Usuarios y configuración',
      icon: 'ti ti-settings'
    }
  ];

  const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  it('mantiene visible el extremo derecho después de cambiar de nivel', async () => {
    TestBed.configureTestingModule({
      imports: [AdminSidebarV2Component],
      providers: [provideRouter([])]
    });

    const fixture = TestBed.createComponent(AdminSidebarV2Component);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('domainDefinitions', domains);
    fixture.detectChanges();

    const domain = fixture.nativeElement.querySelector('.admin-nav-v2__domain') as HTMLButtonElement;
    domain.click();
    fixture.detectChanges();
    await nextFrame();

    const breadcrumbs = fixture.nativeElement.querySelector('.admin-nav-v2__breadcrumbs') as HTMLElement;
    Object.defineProperty(breadcrumbs, 'scrollWidth', { configurable: true, value: 720 });

    let group = fixture.nativeElement.querySelector('.admin-nav-v2__item') as HTMLButtonElement;
    group.click();
    fixture.detectChanges();
    await nextFrame();
    expect(breadcrumbs.scrollLeft).toBe(720);

    breadcrumbs.scrollLeft = 80;
    fixture.detectChanges();
    await nextFrame();
    expect(breadcrumbs.scrollLeft).toBe(80);

    group = fixture.nativeElement.querySelector('.admin-nav-v2__item') as HTMLButtonElement;
    group.click();
    fixture.detectChanges();
    await nextFrame();
    expect(breadcrumbs.scrollLeft).toBe(720);
  });

  it('fija el dominio elegido y no reemplaza su contenido al pasar por otro dominio', () => {
    TestBed.configureTestingModule({
      imports: [AdminSidebarV2Component],
      providers: [provideRouter([])]
    });

    const fixture = TestBed.createComponent(AdminSidebarV2Component);
    fixture.componentRef.setInput('items', multiDomainItems);
    fixture.componentRef.setInput('domainDefinitions', multiDomains);
    fixture.detectChanges();

    const domainButtons = fixture.nativeElement.querySelectorAll('.admin-nav-v2__domain') as NodeListOf<HTMLButtonElement>;
    domainButtons[0].click();
    fixture.detectChanges();

    domainButtons[1].dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();

    const heading = fixture.nativeElement.querySelector('.admin-nav-v2__panel-header strong') as HTMLElement;
    expect(heading.textContent?.trim()).toBe('Operación');

    domainButtons[1].click();
    fixture.detectChanges();
    expect(heading.textContent?.trim()).toBe('Sistema');
  });

  it('espera 200 ms antes de abrir por hover, fija el grupo y lo recupera desde el rail', async () => {
    TestBed.configureTestingModule({
      imports: [AdminSidebarV2Component],
      providers: [provideRouter([])]
    });

    const fixture = TestBed.createComponent(AdminSidebarV2Component);
    fixture.componentRef.setInput('items', multiDomainItems);
    fixture.componentRef.setInput('domainDefinitions', multiDomains);
    fixture.detectChanges();

    const domainButtons = fixture.nativeElement.querySelectorAll('.admin-nav-v2__domain') as NodeListOf<HTMLButtonElement>;
    domainButtons[0].dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.admin-nav-v2').classList).not.toContain('admin-nav-v2--open');

    await new Promise((resolve) => setTimeout(resolve, 220));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.admin-nav-v2').classList).toContain('admin-nav-v2--open');

    const group = fixture.nativeElement.querySelector('.admin-nav-v2__item--group') as HTMLButtonElement;
    group.click();
    fixture.detectChanges();

    const close = fixture.nativeElement.querySelector('.admin-nav-v2__close') as HTMLButtonElement;
    close.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.admin-nav-v2').classList).not.toContain('admin-nav-v2--open');

    const rail = fixture.nativeElement.querySelector('.admin-nav-v2__rail') as HTMLElement;
    rail.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.admin-nav-v2').classList).not.toContain('admin-nav-v2--open');

    await new Promise((resolve) => setTimeout(resolve, 220));
    fixture.detectChanges();

    const breadcrumbs = fixture.nativeElement.querySelector('.admin-nav-v2__breadcrumbs') as HTMLElement;
    expect(fixture.nativeElement.querySelector('.admin-nav-v2').classList).toContain('admin-nav-v2--open');
    expect(breadcrumbs.textContent).toContain('Plataformas');

    domainButtons[1].dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(breadcrumbs.textContent).toContain('Plataformas');
  });

  it('cierra el panel al seleccionar una ruta aunque ya sea la ruta activa', () => {
    TestBed.configureTestingModule({
      imports: [AdminSidebarV2Component],
      providers: [provideRouter([])]
    });

    const fixture = TestBed.createComponent(AdminSidebarV2Component);
    fixture.componentRef.setInput('items', multiDomainItems);
    fixture.componentRef.setInput('domainDefinitions', multiDomains);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component['currentUrl'].set('/usuarios');
    component['openPanelId'].set('system');
    fixture.detectChanges();

    component['selectRoute']();
    fixture.detectChanges();

    expect(component['openPanelId']()).toBeNull();
  });

  it('cierra al salir hacia la web y permite usar el fondo difuminado como respaldo', async () => {
    TestBed.configureTestingModule({
      imports: [AdminSidebarV2Component],
      providers: [provideRouter([])]
    });

    const fixture = TestBed.createComponent(AdminSidebarV2Component);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('domainDefinitions', domains);
    fixture.detectChanges();

    const domain = fixture.nativeElement.querySelector('.admin-nav-v2__domain') as HTMLButtonElement;
    domain.click();
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector('.admin-nav-v2__focus-layer') as HTMLButtonElement;
    expect(backdrop.disabled).toBe(false);
    backdrop.dispatchEvent(new MouseEvent('mouseenter'));
    await new Promise((resolve) => setTimeout(resolve, 200));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.admin-nav-v2').classList).not.toContain('admin-nav-v2--open');

    domain.click();
    fixture.detectChanges();
    backdrop.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.admin-nav-v2').classList).not.toContain('admin-nav-v2--open');
  });

  it('abre la asistencia desde el indicador compacto y retransmite la acción elegida', async () => {
    TestBed.configureTestingModule({
      imports: [AdminSidebarV2Component],
      providers: [provideRouter([])]
    });
    const attendanceActions: AttendanceActionOption[] = [
      {
        key: 'lunch',
        actionId: 'INICIAR_ALMUERZO',
        targetStatus: 'ALMUERZO',
        label: 'Iniciar almuerzo',
        enabled: true
      }
    ];
    const fixture = TestBed.createComponent(AdminSidebarV2Component);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('domainDefinitions', domains);
    fixture.componentRef.setInput('attendanceActions', attendanceActions);
    fixture.detectChanges();
    const emitted: string[] = [];
    fixture.componentInstance.attendanceActionSelected.subscribe((action) => emitted.push(action));

    (fixture.nativeElement.querySelector('.admin-nav-v2__status') as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.admin-nav-v2').classList).toContain('admin-nav-v2--open');
    const option = fixture.nativeElement.querySelector('.sidebar-attendance__option') as HTMLButtonElement;
    option.click();
    fixture.detectChanges();
    expect(emitted).toEqual(['INICIAR_ALMUERZO']);
  });

  it('mantiene visible la asistencia durante la guía y permite cancelarla desde el fondo', async () => {
    TestBed.configureTestingModule({
      imports: [AdminSidebarV2Component],
      providers: [provideRouter([])]
    });
    const fixture = TestBed.createComponent(AdminSidebarV2Component);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('domainDefinitions', domains);
    fixture.componentRef.setInput('attendanceActions', [
      {
        key: 'offline',
        actionId: 'REGISTRAR_SALIDA',
        targetStatus: 'OFFLINE',
        label: 'Marcar salida',
        enabled: true
      }
    ] satisfies AttendanceActionOption[]);
    const cancellations: boolean[] = [];
    fixture.componentInstance.attendanceGuidanceCancelled.subscribe(() => cancellations.push(true));
    fixture.componentRef.setInput('attendanceGuided', true);
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sidebar-attendance__option.is-guided')).toBeTruthy();
    (fixture.nativeElement.querySelector('.admin-nav-v2__focus-layer') as HTMLButtonElement).click();
    expect(cancellations).toEqual([true]);
  });

  it('muestra modos de trabajo duales y emite el cambio elegido', () => {
    TestBed.configureTestingModule({
      imports: [AdminSidebarV2Component],
      providers: [provideRouter([])]
    });

    const fixture = TestBed.createComponent(AdminSidebarV2Component);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('domainDefinitions', domains);
    fixture.componentRef.setInput('activeRole', 'ASESOR_POSTVENTA');
    fixture.componentRef.setInput('roleModes', [
      {
        role: 'ASESOR_POSTVENTA',
        label: 'Postventa',
        description: 'Gestionar cartera postventa',
        icon: 'ti ti-headset'
      },
      {
        role: 'ASESOR_BACKOFFICE',
        label: 'Backoffice',
        description: 'Gestionar operación comercial',
        icon: 'ti ti-briefcase'
      }
    ]);
    const emitted: string[] = [];
    fixture.componentInstance.roleModeSelected.subscribe((role) => emitted.push(role));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.admin-nav-v2__profile-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();

    const actions = fixture.nativeElement.querySelectorAll('.admin-nav-v2__profile-action') as NodeListOf<HTMLButtonElement>;
    expect(actions[0].textContent).toContain('Postventa');
    expect(actions[0].classList).toContain('is-active');
    expect(actions[1].textContent).toContain('Backoffice');

    actions[1].click();
    fixture.detectChanges();

    expect(emitted).toEqual(['ASESOR_BACKOFFICE']);
  });
});
