import { DatePipe, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PopoverModule } from 'primeng/popover';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PhoneNumberFieldComponent } from '../../../../shared/components/phone-number-field/phone-number-field.component';
import { RankingFacade } from '../../../ranking/facades/ranking.facade';
import { RankingViewComponent } from '../../../ranking/components/ranking-view/ranking-view.component';
import { GtrWorkspaceFacade } from '../../facades/gtr-workspace.facade';
import { GtrAdvisorsDrawerComponent } from '../../components/gtr-advisors-drawer/gtr-advisors-drawer.component';
import { GtrAgendadosBoardComponent } from '../../components/gtr-agendados-board/gtr-agendados-board.component';
import { GtrHistoricosBoardComponent } from '../../components/gtr-historicos-board/gtr-historicos-board.component';
import { GtrLeadsBoardComponent } from '../../components/gtr-leads-board/gtr-leads-board.component';
import { GtrEventsDialogComponent } from '../../components/gtr-events-dialog/gtr-events-dialog.component';
import { GtrAdvisorEventsDialogComponent } from '../../components/gtr-advisor-events-dialog/gtr-advisor-events-dialog.component';
import { GtrSearchDialogComponent } from '../../components/gtr-search-dialog/gtr-search-dialog.component';
import { GtrScheduleExtensionDialogComponent } from '../../components/gtr-schedule-extension-dialog/gtr-schedule-extension-dialog.component';
import { GtrTipificationDialogComponent } from '../../components/gtr-tipification-dialog/gtr-tipification-dialog.component';

@Component({
  selector: 'app-gtr-workspace-page',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    UpperCasePipe,
    ButtonModule,
    CardModule,
    DatePickerModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    PopoverModule,
    SelectModule,
    TableModule,
    TagModule,
    TooltipModule,
    PhoneNumberFieldComponent,
    RankingViewComponent,
    GtrAdvisorsDrawerComponent,
    GtrAgendadosBoardComponent,
    GtrHistoricosBoardComponent,
    GtrLeadsBoardComponent,
    GtrEventsDialogComponent,
    GtrAdvisorEventsDialogComponent,
    GtrSearchDialogComponent,
    GtrScheduleExtensionDialogComponent,
    GtrTipificationDialogComponent
  ],
  providers: [GtrWorkspaceFacade, RankingFacade],
  templateUrl: './gtr-workspace-page.component.html',
  styleUrl: './gtr-workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GtrWorkspacePageComponent implements OnInit, OnDestroy {
  protected readonly facade = inject(GtrWorkspaceFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly routeSubscription = new Subscription();

  ngOnInit(): void {
    this.routeSubscription.add(
      this.route.data.subscribe((data) => {
        const section = data['section'];
        if (section === 'plataforma' || section === 'agendados' || section === 'historicos' || section === 'ranking') {
          this.facade.setSection(section);
        }
      })
    );
    this.facade.start();
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
    this.facade.stop();
  }
}
