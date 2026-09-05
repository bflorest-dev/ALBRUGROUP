import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminSidebarV2Component } from './admin-sidebar-v2.component';
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
});
