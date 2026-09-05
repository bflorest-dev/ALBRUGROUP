import { TestBed } from '@angular/core/testing';
import { TopBannerComponent } from './top-banner.component';

describe('TopBannerComponent', () => {
  it('no reserva una franja completa mientras no tenga contenido', () => {
    TestBed.configureTestingModule({ imports: [TopBannerComponent] });
    const fixture = TestBed.createComponent(TopBannerComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.top-banner')).toBeNull();
  });

  it('presenta el contexto operativo sin acciones de asistencia', () => {
    TestBed.configureTestingModule({ imports: [TopBannerComponent] });
    const fixture = TestBed.createComponent(TopBannerComponent);
    fixture.componentRef.setInput('title', 'Buenas tardes, María');
    fixture.componentRef.setInput('detail', 'Backoffice · Espacio operativo');
    fixture.componentRef.setInput('context', 'Programados');
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.top-banner') as HTMLElement;
    expect(banner.textContent).toContain('Buenas tardes, María');
    expect(banner.textContent).toContain('Backoffice · Espacio operativo');
    expect(banner.textContent).toContain('Programados');
    expect(banner.querySelector('button')).toBeNull();
  });
});
