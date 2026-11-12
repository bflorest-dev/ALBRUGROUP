import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { SupervisorGtrOperativoFacade } from '../../facades/supervisor-gtr-operativo.facade';
import { PhoneNumberFieldComponent } from '../../../../shared/components/phone-number-field/phone-number-field.component';
import { GtrLeadSelectControlComponent } from '../../components/gtr-lead-select-control/gtr-lead-select-control.component';
import { providerLogo as resolveProviderLogo } from '../../../../shared/utils/provider-logo';

@Component({
  selector: 'app-supervisor-gtr-operativo-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MessageModule,
    ButtonModule,
    TableModule,
    DialogModule,
    DatePickerModule,
    SelectModule,
    InputTextModule,
    TagModule,
    ProgressSpinnerModule,
    TooltipModule,
    PhoneNumberFieldComponent,
    GtrLeadSelectControlComponent
  ],
  providers: [SupervisorGtrOperativoFacade],
  templateUrl: './supervisor-gtr-operativo-page.component.html',
  styleUrl: './supervisor-gtr-operativo-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SupervisorGtrOperativoPageComponent implements OnInit {
  protected readonly facade = inject(SupervisorGtrOperativoFacade);
  protected readonly providerLogo = resolveProviderLogo;

  private readonly origenVisualMap: Record<string, { icon: string; label: string; tone: string }> = {
    WHATSAPP: { icon: 'pi pi-whatsapp', label: 'WhatsApp', tone: 'whatsapp' },
    MESSENGER: { icon: 'pi pi-facebook', label: 'Messenger', tone: 'messenger' },
    RECONTACTO: { icon: 'pi pi-replay', label: 'Recontacto', tone: 'recontacto' },
    PREDICTIVO: { icon: 'pi pi-phone', label: 'Predictivo', tone: 'predictivo' },
    REFERIDO: { icon: 'pi pi-share-alt', label: 'Referido', tone: 'referido' },
    MASIVO: { icon: 'pi pi-megaphone', label: 'Masivo', tone: 'masivo' },
    SIN_IDENTIFICAR: { icon: 'pi pi-question-circle', label: 'Sin identificar', tone: 'desconocido' }
  };

  protected origenVisual(origen?: string | null): { icon: string; label: string; tone: string } {
    const normalized = (origen ?? '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');

    return this.origenVisualMap[normalized] ?? {
      icon: 'pi pi-question-circle',
      label: origen?.trim() || 'Sin identificar',
      tone: 'desconocido'
    };
  }

  protected usermetaLabel(usermeta?: string | null): string {
    const value = (usermeta ?? '').trim();
    if (!value) return 'Sin usermeta';
    return value.startsWith('@') ? value : `@${value}`;
  }

  ngOnInit(): void {
    void this.facade.inicializar();
  }

  protected onPageChange(event: { first?: number | null; rows?: number | null }): void {
    const page = event.first != null && event.rows ? Math.floor(event.first / event.rows) : 0;
    void this.facade.cargarLeadsSinEquipo(page);
  }
}
