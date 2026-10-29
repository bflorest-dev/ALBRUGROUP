import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, OnInit, inject, input, output, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, timeout } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { RecruiterPostulantesService } from '../../services/recruiter-postulantes.service';
import { RecruitmentRealtimeService } from '../../../../core/services/recruitment-realtime.service';
import { PostulacionResponse } from '../../../../shared/models/recruitment/postulacion-response';
import { CatalogoTipificacionResponse } from '../../../../shared/models/recruitment/catalogo-tipificacion-response';
import { EventoResponse } from '../../../../shared/models/recruitment/evento-response';
import { GrupoCapacitacionResponse } from '../../../../shared/models/recruitment/grupo-capacitacion-response';
import { GestionAccion, GestionReclutamiento, GestionRequest, HorarioMeet } from '../../../../shared/models/recruitment/gestion-reclutamiento';

@Component({
 selector:'app-gestion-reclutamiento-drawer',
 imports:[ReactiveFormsModule,A11yModule],
 templateUrl:'./gestion-drawer.component.html',
 styleUrl:'./gestion-drawer.component.scss',
 changeDetection:ChangeDetectionStrategy.OnPush
})
export class GestionDrawerComponent implements OnInit {
 readonly postulacion=input.required<PostulacionResponse>();
 readonly closed=output<void>();
 readonly saved=output<void>();
 private readonly api=inject(RecruiterPostulantesService);
 private readonly realtime=inject(RecruitmentRealtimeService);
 private readonly destroyRef=inject(DestroyRef);
 private readonly element=inject(ElementRef<HTMLElement>);
 private readonly fb=inject(FormBuilder);
 readonly state=signal<GestionReclutamiento|null>(null);
 readonly catalog=signal<CatalogoTipificacionResponse|null>(null);
 readonly groups=signal<GrupoCapacitacionResponse[]>([]);
 readonly meetSlots=signal<HorarioMeet[]>([]);
 readonly meetSlotsLoading=signal(false);
 readonly events=signal<EventoResponse[]>([]);
 readonly historyPage=signal(0);
 readonly historyPages=signal(0);
 readonly historyLoading=signal(false);
 readonly panel=signal<'gestion'|'datos'|'historial'>('gestion');
 readonly action=signal<GestionAccion|null>(null);
 readonly contactResult=signal<'sin'|'con'|'no'|null>(null);
 readonly loading=signal(true);
 readonly busy=signal(false);
 readonly error=signal('');
 readonly invalidField=signal('');
 readonly message=signal('');
 readonly stale=signal(false);
 readonly confirmation=signal<'close'|'submit'|'change'|null>(null);
 private pendingAction:GestionAccion|null=null;
 private pendingContact:'sin'|'con'|'no'|null=null;
 readonly contacting=signal<'LLAMADA'|'WHATSAPP'|null>(null);
 readonly contacted=signal<'LLAMADA'|'WHATSAPP'|null>(null);
 readonly contactAttempt=signal<{channel:'LLAMADA'|'WHATSAPP';at:string}|null>(null);
 readonly p=computed(()=>this.state()?.postulacion??this.postulacion());
 readonly pending=computed(()=>this.state()?.actividades.find(a=>a.estado==='PENDIENTE'));
 readonly pendingMeet=computed(()=>{const next=this.pending();return next?.tipo==='ENTREVISTA'&&next.modalidad==='MEET';});
 readonly active=computed(()=>!!this.state()?.accionesDisponibles.length);
 readonly form=this.fb.nonNullable.group({
  fechaHoraGestion:[this.now(),Validators.required], modalidadContacto:['LLAMADA',Validators.required],
  motivo:[''], observacion:['',Validators.maxLength(2000)], programarReintento:[false],
  fechaHoraActividad:[''], modalidadActividad:['LLAMADA'], referencia:[''], idGrupoCapacitacion:[0],
  fechaMeet:[''], idHorarioMeet:[0], idSesionMeet:[0]
 });
 readonly changed=signal(0);
 readonly meetBooking=computed(()=>{this.changed();return ['AGENDAR_MEET','REPROGRAMAR_MEET'].includes(this.action()??'');});
 readonly scheduled=computed(()=>{this.changed();return ['AGENDAR','REPROGRAMAR'].includes(this.action()??'')||(this.action()==='SEGUIMIENTO'&&this.form.controls.programarReintento.value);});
  showManualManagementDetails(action:GestionAccion):boolean {
   // La gestión empieza desde Llamar o WhatsApp. La fecha/canal del contacto
   // son automáticos; solo la próxima actividad mantiene fecha y hora editables.
   return false;
  }
 readonly reasons=computed(()=>{
  const code=this.action()==='NO_CONTACTO'?'SIN_CONTACTO':this.action()==='RECHAZAR'?'RECHAZADO':'NO_INTERESADO';
  return this.catalog()?.tipificaciones.find(t=>t.codigo===code)?.subtipificaciones
   .filter(s=>s.alcance==='GENERAL'||this.p().puestoObjetivo==='ASESOR_VENTAS')??[];
 });
 readonly cta=computed(()=>this.busy()?'Procesando…':this.title(this.action()));
 ngOnInit():void {
  this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(()=>{this.changed.update(v=>v+1);this.error.set('');this.invalidField.set('');});
  this.load();
  this.realtime.watchTopic('/topic/postulaciones').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(()=>{
   if(this.busy()) return;
   this.api.obtenerGestion(this.p().id).pipe(timeout(15000),takeUntilDestroyed(this.destroyRef)).subscribe({
    next:s=>{
     if(s.revision!==this.state()?.revision||s.postulacion.updatedAt!==this.p().updatedAt||s.postulacion.etapa!==this.p().etapa||s.postulacion.estado!==this.p().estado) {
      if(this.form.dirty||this.action()) this.stale.set(true);
      else this.state.set(s);
     }
     this.loadHistory();
    },error:()=>{this.stale.set(true);}
   });
  });
  this.realtime.watchTopic('/topic/grupos-capacitacion').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(()=>this.loadGroups());
 }
 load():void {
  this.loading.set(true);this.error.set('');
  forkJoin({state:this.api.obtenerGestion(this.postulacion().id),catalog:this.api.obtenerCatalogoReclutamiento()})
   .pipe(timeout(15000),takeUntilDestroyed(this.destroyRef)).subscribe({
    next:r=>{this.state.set(r.state);this.catalog.set(r.catalog);this.loading.set(false);this.stale.set(false);},
    error:e=>{this.error.set(this.errorText(e));this.loading.set(false);}
   });
  this.loadGroups();this.loadMeetSlots();this.loadHistory();
 }
 loadGroups():void {
  this.api.listarGruposCapacitacionAbiertos().pipe(timeout(15000),takeUntilDestroyed(this.destroyRef)).subscribe({
   next:r=>this.groups.set(r.content),error:()=>this.error.set('No se pudieron cargar los grupos. Pulsa Actualizar grupos para reintentar.')
  });
 }
 loadMeetSlots():void {
  const negocio=this.p().negocio;
  if(!negocio){this.meetSlots.set([]);return;}
  this.meetSlotsLoading.set(true);
  this.api.listarHorariosMeet(negocio).pipe(timeout(15000),takeUntilDestroyed(this.destroyRef)).subscribe({
   next:r=>{this.meetSlots.set(r);this.meetSlotsLoading.set(false);},
   error:()=>{this.meetSlots.set([]);this.meetSlotsLoading.set(false);}
  });
 }
 loadHistory(page=0):void {
  this.historyLoading.set(true);
  this.api.listarEventos(this.postulacion().id,page).pipe(timeout(15000),takeUntilDestroyed(this.destroyRef)).subscribe({
   next:r=>{this.events.set(r.content);this.historyPage.set(r.page);this.historyPages.set(r.totalPages);this.historyLoading.set(false);},error:()=>{this.historyLoading.set(false);this.error.set('No se pudo cargar el historial. Puedes reintentar la carga.');}
  });
 }
 can(a:GestionAccion):boolean{return !!this.state()?.accionesDisponibles.includes(a);}
 chooseContact(value:'sin'|'con'|'no'):void {
  this.requestAction(value==='sin'?'NO_CONTACTO':value==='no'?'NO_INTERESADO':null,value);
 }
 choose(a:GestionAccion|null):void {
  this.requestAction(a,this.contactResult());
 }
 requestAction(a:GestionAccion|null,contact:'sin'|'con'|'no'|null):void {
  if(this.busy())return;
  if(this.form.dirty&&a!==this.action()) {
   this.pendingAction=a;this.pendingContact=contact;this.confirmation.set('change');return;
  }
  this.applyAction(a,contact);
 }
 confirmChange():void {this.reset();this.applyAction(this.pendingAction,this.pendingContact);}
 private applyAction(a:GestionAccion|null,contact:'sin'|'con'|'no'|null):void {
  this.contactResult.set(contact);
  this.action.set(a);this.message.set('');this.error.set('');
  this.form.patchValue({motivo:'',idGrupoCapacitacion:0,programarReintento:false});
  if(a==='REPROGRAMAR'&&this.pending()) this.form.patchValue({modalidadActividad:this.pending()!.modalidad,referencia:this.pending()!.referencia??''});
  if(['AGENDAR_MEET','REPROGRAMAR_MEET'].includes(a??'')) this.loadMeetSlots();
  this.changed.update(v=>v+1);
 }
 cancel():void {
  this.requestAction(null,null);
 }
 reset():void {
  this.form.reset({fechaHoraGestion:this.now(),modalidadContacto:'LLAMADA',motivo:'',observacion:'',programarReintento:false,fechaHoraActividad:'',modalidadActividad:'LLAMADA',referencia:'',idGrupoCapacitacion:0,fechaMeet:'',idHorarioMeet:0,idSesionMeet:0});
  this.action.set(null);this.contactResult.set(null);this.contactAttempt.set(null);this.contacted.set(null);this.error.set('');this.confirmation.set(null);
 }
 close():void {if(this.busy())return;if(this.form.dirty||this.action())this.confirmation.set('close');else this.closed.emit();}
 confirmClose():void {this.closed.emit();}
 @HostListener('document:keydown.escape',['$event'])
 escape(event:Event):void {event.preventDefault();if(this.confirmation())this.confirmation.set(null);else this.close();}
 @HostListener('window:beforeunload',['$event'])
 beforeUnload(event:BeforeUnloadEvent):void {if(this.form.dirty){event.preventDefault();event.returnValue='';}}
 reloadContext():void {this.stale.set(false);this.load();this.message.set('Contexto actualizado. Revisa tu borrador antes de guardar.');}
 validate():boolean {
  const a=this.action();const r=this.form.getRawValue();
  this.form.markAllAsTouched();
  const meet=['AGENDAR_MEET','REPROGRAMAR_MEET'].includes(a??'');
  const needsObservation=['EVALUAR','RECHAZAR','NO_INTERESADO','APROBAR','INASISTENCIA','CANCELAR_CITA','ASIGNAR_GRUPO'].includes(a??'');
  let error='';let field='';
  if(!a||!this.can(a)) {error='Selecciona una acción disponible para esta postulación.';}
  else if(['NO_CONTACTO','SEGUIMIENTO','AGENDAR_MEET','REPROGRAMAR_MEET','NO_INTERESADO'].includes(a??'')&&!this.contactAttempt()) {error='Inicia el contacto con Llamar o WhatsApp para registrar la hora y el canal automáticamente.';field='contactAttempt';}
  else if(a!=='NO_CONTACTO'&&this.showManualManagementDetails(a!)&&!r.fechaHoraGestion) {error='Indica cuándo ocurrió esta gestión.';field='fechaHoraGestion';}
  else if(['NO_CONTACTO','NO_INTERESADO','RECHAZAR'].includes(a)&&!r.motivo) {error='Selecciona el motivo del resultado.';field='motivo';}
  else if(needsObservation&&!r.observacion.trim()) {error='Describe el resultado de esta gestión.';field='observacion';}
  else if(r.observacion.length>2000) {error='La observación admite hasta 2000 caracteres.';field='observacion';}
  else if(meet&&!r.fechaMeet) {error='Selecciona la fecha del Meet.';field='fechaMeet';}
  else if(meet&&!Number(r.idHorarioMeet)) {error='Selecciona un horario disponible.';field='idHorarioMeet';}
  else if(this.scheduled()&&(!r.fechaHoraActividad||!r.modalidadActividad)) {error='Indica fecha, hora y canal de la próxima llamada.';field=!r.fechaHoraActividad?'fechaHoraActividad':'modalidadActividad';}
  else if(this.scheduled()&&new Date(r.fechaHoraActividad).getTime()<=Date.now()) {error='La próxima llamada debe estar en el futuro.';field='fechaHoraActividad';}
  else if(a==='ASIGNAR_GRUPO'&&!Number(r.idGrupoCapacitacion)) {error='Selecciona un grupo abierto para asignar.';field='idGrupoCapacitacion';}
  this.invalidField.set(error?field:'');this.error.set(error);
  if(error)queueMicrotask(()=>{
   const target=this.element.nativeElement.querySelector(field==='contactAttempt'?'[data-contact-attempt]':field?'[formControlName="'+field+'"]':'[role="alert"]');
   target?.scrollIntoView({block:'center',behavior:'smooth'});(target as HTMLElement|null)?.focus?.({preventScroll:true});
  });
  return !error;
 }
 submit():void {
  if(this.busy()||this.stale()||!this.validate())return;
  if(['APROBAR','RECHAZAR','NO_INTERESADO'].includes(this.action()!))this.confirmation.set('submit');
  else this.persist();
 }
 persist():void {
  if(!this.validate()||this.busy()||this.stale())return;
  this.confirmation.set(null);this.busy.set(true);this.message.set('');
  const r=this.form.getRawValue();
  const attempt=this.contactAttempt();
  const action=this.action()!;
  const meet=['AGENDAR_MEET','REPROGRAMAR_MEET'].includes(action);
  const automaticManagement=['ASISTIO_MEET','INASISTENCIA','EVALUAR','APROBAR','RECHAZAR','CANCELAR_CITA','ASIGNAR_GRUPO'].includes(action);
  const fechaHoraGestion=automaticManagement?this.nowWithSeconds():(attempt?.at??r.fechaHoraGestion)||this.nowWithSeconds();
  const payload:GestionRequest={accion:action,revision:this.state()!.revision,
   fechaHoraGestion,
   modalidadContacto:attempt&&['NO_CONTACTO','SEGUIMIENTO','AGENDAR_MEET','REPROGRAMAR_MEET','NO_INTERESADO'].includes(action)?attempt.channel:meet||['ASISTIO_MEET','INASISTENCIA','EVALUAR','APROBAR','RECHAZAR','ASIGNAR_GRUPO'].includes(action)?'MEET':r.modalidadContacto,
   observacion:r.observacion.trim(),motivo:r.motivo||null,
   fechaHoraActividad:this.scheduled()?r.fechaHoraActividad:null,modalidadActividad:this.scheduled()?r.modalidadActividad:null,
   referencia:this.scheduled()?r.referencia.trim()||null:null,idGrupoCapacitacion:action==='ASIGNAR_GRUPO'?Number(r.idGrupoCapacitacion):null,
   fechaMeet:meet?r.fechaMeet:null,idHorarioMeet:meet?Number(r.idHorarioMeet):null,idSesionMeet:meet?Number(r.idSesionMeet)||null:null};
  this.api.registrarGestion(this.p().id,payload).pipe(timeout(15000),takeUntilDestroyed(this.destroyRef)).subscribe({
   next:s=>{this.state.set(s);this.busy.set(false);this.reset();this.message.set(s.ultimoResultado??'Gestión guardada');this.loadHistory();this.saved.emit();},
   error:(e:HttpErrorResponse)=>{this.busy.set(false);this.error.set(this.errorText(e));if(e.status===409)this.stale.set(true);}
  });
 }
 contact(channel:'LLAMADA'|'WHATSAPP'):void {
  if(this.busy()||!this.active())return;
  const hadDraft=this.form.dirty;
  this.busy.set(true);this.contacting.set(channel);this.contacted.set(null);this.error.set('');this.message.set('');
  const number=(channel==='LLAMADA'?(this.p().postulante.numeroExclusivoLlamadas||this.p().postulante.celular):this.p().postulante.celular).replace(/\D/g,'');
  const normalized=number.length===9?'51'+number:number;
  this.api.registrarContacto(this.p().id,{modalidadContacto:channel,fechaHoraGestion:this.now(),observacion:'Intento iniciado por '+this.label(channel)})
   .pipe(timeout(15000),takeUntilDestroyed(this.destroyRef)).subscribe({
   next:r=>{this.busy.set(false);this.contacting.set(null);this.contacted.set(channel);this.contactAttempt.set({channel:r.modalidadContacto,at:r.fechaHoraGestion});this.message.set('Intento registrado. Indica el resultado de la comunicación.');this.form.patchValue({modalidadContacto:r.modalidadContacto,fechaHoraGestion:r.fechaHoraGestion});if(!hadDraft)this.form.markAsPristine();this.loadHistory();
     window.open(channel==='LLAMADA'?'tel:'+number:'https://wa.me/'+normalized,'_blank','noopener,noreferrer');},
    error:e=>{this.busy.set(false);this.contacting.set(null);this.error.set(this.errorText(e));}
   });
 }
 title(a:GestionAccion|null):string {
  const labels:Record<GestionAccion,string>={NO_CONTACTO:'Guardar intento',SEGUIMIENTO:'Guardar seguimiento',AGENDAR:'Programar actividad',AGENDAR_MEET:'Asignar Meet',REPROGRAMAR:'Reprogramar actividad',REPROGRAMAR_MEET:'Reprogramar Meet',ASISTIO_MEET:'Registrar asistencia',INASISTENCIA:'Registrar inasistencia',CANCELAR_CITA:'Cancelar actividad',EVALUAR:'Registrar evaluación',NO_INTERESADO:'Cerrar postulación',RECHAZAR:'Rechazar postulación',APROBAR:'Aprobar postulación',ASIGNAR_GRUPO:'Asignar grupo'};
  return a?labels[a]:'Selecciona una gestión';
 }
 label(s:string|null|undefined):string {
  const labels:Record<string,string>={RECLUTAMIENTO:'Postulación',POSTULANTE:'Por contactar',EN_GESTION:'En gestión',SIN_CONTACTO:'Sin contacto',NO_INTERESADO:'No interesado',EN_PROCESO:'En proceso',WHATSAPP:'WhatsApp',MEET:'Meet',APTO_PARA_CAPACITACION:'Apto para capacitación'};
  return !s?'Sin registrar':labels[s]??s.toLowerCase().replace(/_/g,' ').replace(/^./,x=>x.toUpperCase());
 }
 date(value:string|null|undefined):string {
  if(!value)return 'Sin registrar';
  return new Date(value.length===10?value+'T12:00:00':value).toLocaleString('es-PE',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
 }
 overdue():boolean {return !!this.pending()&&new Date(this.pending()!.fechaHora).getTime()<Date.now();}
 now():string {const d=new Date();const z=(n:number)=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())+'T'+z(d.getHours())+':'+z(d.getMinutes());}
 nowWithSeconds():string {const d=new Date();const z=(n:number)=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())+'T'+z(d.getHours())+':'+z(d.getMinutes())+':'+z(d.getSeconds());}
 errorText(e:HttpErrorResponse):string {return e.error?.message??'No se pudo completar la operación. Conservamos tus datos; vuelve a intentarlo.';}
}
