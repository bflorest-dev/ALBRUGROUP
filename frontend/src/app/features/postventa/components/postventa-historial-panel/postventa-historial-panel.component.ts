import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { PostventaWorkspaceFacade } from '../../facades/postventa-workspace.facade';
import { EventoResponse } from '../../../../shared/models/preventa/preventa.models';

type HistoryFilter = 'TODO' | 'TIPIFICACION';

interface HistoryGroup {
  key: string;
  label: string;
  events: EventoResponse[];
}

@Component({
  selector: 'app-postventa-historial-panel',
  imports: [],
  templateUrl: './postventa-historial-panel.component.html',
  styleUrl: './postventa-historial-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostventaHistorialPanelComponent {
  protected readonly facade = inject(PostventaWorkspaceFacade);
  protected readonly historyFilter = signal<HistoryFilter>('TODO');

  protected readonly historyGroups = computed<HistoryGroup[]>(() => {
    let eventos = this.facade.eventos();
    const filter = this.historyFilter();
    if (filter === 'TIPIFICACION') {
      eventos = eventos.filter(e => e.tipificacion || e.subtipificacion);
    }
    const groups = new Map<string, EventoResponse[]>();
    for (const e of eventos) {
      const key = e.createdAt?.slice(0, 10) ?? '—';
      const list = groups.get(key);
      if (list) {
        list.push(e);
      } else {
        groups.set(key, [e]);
      }
    }
    return Array.from(groups.entries()).map(([key, events]) => ({
      key,
      label: this.formatDateLabel(key),
      events
    }));
  });

  protected eventTitle(event: EventoResponse): string {
    if (event.tipificacion && event.subtipificacion) {
      return `${event.tipificacion} → ${event.subtipificacion}`;
    }
    if (event.tipificacion) return event.tipificacion;
    return event.accion ?? 'Evento';
  }

  protected eventIcon(event: EventoResponse): string {
    if (event.tipificacion) return 'pi pi-check';
    return 'pi pi-bolt';
  }

  protected formatTime(value: string | null | undefined): string {
    if (!value) return '—';
    try {
      const d = new Date(value);
      const h = d.getHours();
      const m = String(d.getMinutes()).padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${m} ${ampm}`;
    } catch {
      return '—';
    }
  }

  private formatDateLabel(key: string): string {
    if (key === '—') return 'Sin fecha';
    try {
      const [y, m, d] = key.split('-');
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
    } catch {
      return key;
    }
  }
}
