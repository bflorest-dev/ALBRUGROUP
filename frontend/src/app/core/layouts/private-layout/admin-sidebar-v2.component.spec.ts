import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminSidebarV2Component } from './admin-sidebar-v2.component';
import { SidebarItem } from './sidebar-item.model';

describe('AdminSidebarV2Component', () => {
  const items: SidebarItem[] = [
    {
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

  const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  it('mantiene visible el extremo derecho después de cambiar de nivel', async () => {
    TestBed.configureTestingModule({
      imports: [AdminSidebarV2Component],
      providers: [provideRouter([])]
    });

    const fixture = TestBed.createComponent(AdminSidebarV2Component);
    fixture.componentRef.setInput('items', items);
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
});
