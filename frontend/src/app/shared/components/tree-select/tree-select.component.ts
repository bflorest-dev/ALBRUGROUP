import { ChangeDetectionStrategy, Component, computed, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { Popover, PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';

export interface TreeSelectGroup {
  label: string;
  nodes: TreeSelectNode[];
}

export interface TreeSelectNode {
  key: string;
  label: string;
  tooltip?: string;
  children?: TreeSelectChild[];
}

export interface TreeSelectChild {
  key: string;
  label: string;
  tooltip?: string;
}

export interface TreeSelectSelection {
  parents: string[];
  children: string[];
}

interface DisplayNode {
  key: string;
  label: string;
  tooltip?: string;
  group: string | null;
  showGroupHeader: boolean;
  children: TreeSelectChild[];
}

@Component({
  selector: 'app-tree-select',
  standalone: true,
  imports: [FormsModule, ButtonModule, CheckboxModule, InputTextModule, PopoverModule, TooltipModule],
  templateUrl: './tree-select.component.html',
  styleUrl: './tree-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreeSelectComponent {
  private static readonly HOVER_OPEN_MS = 180;
  private static readonly HOVER_CLOSE_MS = 220;

  readonly groups = input<TreeSelectGroup[]>([]);
  readonly searchable = input(true);
  readonly placeholder = input('Seleccionar');
  readonly icon = input('pi pi-tags');

  readonly selectedParents = model<string[]>([]);
  readonly selectedChildren = model<string[]>([]);

  readonly selectionChange = output<TreeSelectSelection>();

  protected readonly searchTerm = signal('');
  protected readonly expandedKeys = signal<Set<string>>(new Set());
  protected readonly popoverOpen = signal(false);

  private hoverOpenTimer: ReturnType<typeof setTimeout> | null = null;
  private hoverCloseTimer: ReturnType<typeof setTimeout> | null = null;

  readonly filterCount = computed(() =>
    this.selectedParents().length + this.selectedChildren().length
  );

  protected readonly buttonLabel = computed(() => {
    const count = this.filterCount();
    return count ? `${count} filtros` : this.placeholder();
  });

  protected onTriggerEnter(event: MouseEvent, popover: Popover): void {
    this.cancelClose();
    this.cancelOpen();
    if (this.popoverOpen()) {
      return;
    }
    const target = event.currentTarget as HTMLElement;
    this.hoverOpenTimer = setTimeout(() => {
      this.hoverOpenTimer = null;
      popover.show(event, target);
    }, TreeSelectComponent.HOVER_OPEN_MS);
  }

  protected onTriggerLeave(popover: Popover): void {
    this.cancelOpen();
    this.scheduleClose(popover);
  }

  protected onPanelEnter(): void {
    this.cancelClose();
  }

  protected onPanelLeave(popover: Popover): void {
    this.scheduleClose(popover);
  }

  protected onPopoverShow(): void {
    this.popoverOpen.set(true);
  }

  protected onPopoverHide(): void {
    this.popoverOpen.set(false);
  }

  protected onTriggerClick(event: MouseEvent, popover: Popover): void {
    this.cancelOpen();
    this.cancelClose();
    if (this.popoverOpen()) {
      return;
    }
    popover.show(event, event.currentTarget as HTMLElement);
  }

  protected readonly displayNodes = computed<DisplayNode[]>(() => {
    const groups = this.groups();
    const expanded = this.expandedKeys();
    const showGroups = groups.length > 1;
    const term = this.searchTerm().trim().toLowerCase();
    const result: DisplayNode[] = [];
    let lastGroup: string | null = null;

    for (const group of groups) {
      for (const node of group.nodes) {
        if (term) {
          const nodeMatch = node.label.toLowerCase().includes(term)
            || node.tooltip?.toLowerCase()?.includes(term);
          const childMatch = node.children?.some(c =>
            c.label.toLowerCase().includes(term) || c.tooltip?.toLowerCase()?.includes(term));
          if (!nodeMatch && !childMatch) continue;
        }
        const groupLabel = showGroups ? group.label : null;
        result.push({
          key: node.key,
          label: node.label,
          tooltip: node.tooltip,
          group: groupLabel,
          showGroupHeader: showGroups && groupLabel !== lastGroup,
          children: node.children ?? []
        });
        lastGroup = groupLabel;
      }
    }
    return result;
  });

  protected isParentSelected(key: string): boolean {
    return this.selectedParents().includes(key);
  }

  protected isChildSelected(key: string): boolean {
    return this.selectedChildren().includes(key);
  }

  protected isExpanded(key: string): boolean {
    return this.expandedKeys().has(key);
  }

  protected toggleParent(key: string, children: TreeSelectChild[]): void {
    const parents = [...this.selectedParents()];
    const kids = [...this.selectedChildren()];
    const idx = parents.indexOf(key);
    if (idx >= 0) {
      parents.splice(idx, 1);
    } else {
      parents.push(key);
      for (const child of children) {
        const ci = kids.indexOf(child.key);
        if (ci >= 0) kids.splice(ci, 1);
      }
    }
    this.selectedParents.set(parents);
    this.selectedChildren.set(kids);
    this.emitChange();
  }

  protected toggleChild(parentKey: string, childKey: string, siblings: TreeSelectChild[]): void {
    const parents = [...this.selectedParents()];
    const kids = [...this.selectedChildren()];
    const parentIdx = parents.indexOf(parentKey);
    if (parentIdx >= 0) {
      parents.splice(parentIdx, 1);
      for (const sib of siblings) {
        if (sib.key !== childKey && !kids.includes(sib.key)) {
          kids.push(sib.key);
        }
      }
    } else {
      const ci = kids.indexOf(childKey);
      if (ci >= 0) {
        kids.splice(ci, 1);
      } else {
        kids.push(childKey);
      }
    }
    this.selectedParents.set(parents);
    this.selectedChildren.set(kids);
    this.emitChange();
  }

  protected toggleExpand(key: string): void {
    const keys = new Set(this.expandedKeys());
    if (keys.has(key)) {
      keys.delete(key);
    } else {
      keys.add(key);
    }
    this.expandedKeys.set(keys);
  }

  protected clear(): void {
    this.selectedParents.set([]);
    this.selectedChildren.set([]);
    this.searchTerm.set('');
    this.emitChange();
  }

  private emitChange(): void {
    this.selectionChange.emit({
      parents: this.selectedParents(),
      children: this.selectedChildren()
    });
  }

  private scheduleClose(popover: Popover): void {
    this.cancelClose();
    this.hoverCloseTimer = setTimeout(() => {
      this.hoverCloseTimer = null;
      popover.hide();
    }, TreeSelectComponent.HOVER_CLOSE_MS);
  }

  private cancelOpen(): void {
    if (this.hoverOpenTimer !== null) {
      clearTimeout(this.hoverOpenTimer);
      this.hoverOpenTimer = null;
    }
  }

  private cancelClose(): void {
    if (this.hoverCloseTimer !== null) {
      clearTimeout(this.hoverCloseTimer);
      this.hoverCloseTimer = null;
    }
  }
}
