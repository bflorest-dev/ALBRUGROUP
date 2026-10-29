package pe.albrugroup.recruitment_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.recruitment_service.configuration.CurrentUser;
import pe.albrugroup.recruitment_service.entity.*;
import pe.albrugroup.recruitment_service.entity.enums.*;
import pe.albrugroup.recruitment_service.entity.request.*;
import pe.albrugroup.recruitment_service.entity.response.*;
import pe.albrugroup.recruitment_service.exception.*;
import pe.albrugroup.recruitment_service.repository.*;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor @Transactional
public class GestionReclutamientoService {
 private final PostulacionRepository postulaciones;
 private final GestionReclutamientoRepository gestiones;
 private final ActividadReclutamientoRepository actividades;
 private final TipificacionRepository tipificaciones;
 private final SubtipificacionRepository subtipificaciones;
 private final PostulacionService postulacionService;
 private final EventoService eventos;
 private final PostulacionRealtimeNotifier realtime;
 private final CurrentUser currentUser;
 private final MeetReclutamientoService meetService;
 private final GrupoCapacitacionService grupoService;

 @Transactional(readOnly=true)
 public GestionReclutamientoResponse obtener(Long id) {
  PostulacionResponse p = postulacionService.obtenerPostulacion(id);
  GestionReclutamiento g = gestiones.findById(id).orElseGet(() -> inicial(id));
  List<ActividadReclutamiento> agenda = actividades.findByPostulacionIdOrderByIdDesc(id);
  return new GestionReclutamientoResponse(p,g.getRevision(),g.getEvaluadaAt(),g.getUltimaGestionAt(),
   g.getUltimoResultado(),g.getResultadoEvaluacion(),acciones(p.getEtapa(),p.getEstado(),g,agenda),agenda);
 }

 public GestionReclutamientoResponse registrar(Long id, GestionReclutamientoRequest r) {
  Postulacion p = postulaciones.findLockedById(id).orElseThrow(() -> new NotFoundException(Postulacion.class,id));
  GestionReclutamiento g = gestiones.findById(id).orElseGet(() -> inicial(id));
  if (g.getRevision()!=r.revision()) throw new ConflictException("La ficha cambió. Actualiza el detalle antes de guardar.");
  List<ActividadReclutamiento> agenda = actividades.findByPostulacionIdOrderByIdDesc(id);
   if (!acciones(p.getEtapa(),p.getEstado(),g,agenda).contains(r.accion()))
   throw new BadRequestException("Esta acción no está disponible en el estado actual de la postulación.");
  LocalDateTime ahora = LocalDateTime.now(ZoneId.of("America/Lima"));
  if(r.fechaHoraGestion().isAfter(ahora.plusMinutes(5)))
   throw new BadRequestException("La fecha de gestión no puede estar en el futuro. Usa la fecha de próxima actividad.");
  if(r.fechaHoraGestion().toLocalDate().isBefore(p.getFechaPostulacion()))
   throw new BadRequestException("La gestión no puede ser anterior a la fecha de postulación.");
  if(g.getUltimaGestionAt()!=null && r.fechaHoraGestion().isBefore(g.getUltimaGestionAt()))
   throw new BadRequestException("La gestión no puede ser anterior a la última gestión registrada.");
  validarNoContacto(r);
  ActividadReclutamiento pendiente = agenda.stream().filter(a -> a.getEstado().equals("PENDIENTE")).findFirst().orElse(null);
  String resultado;
  switch(r.accion()) {
   case "NO_CONTACTO" -> {
    tipificar(id,"SIN_CONTACTO",r.motivo(),r);
    resultado="Intento sin contacto";
   }
   case "SEGUIMIENTO" -> {
    tipificar(id,"INTERESADO","SEGUIMIENTO",r);
    if(r.fechaHoraActividad()!=null) {
     cerrar(pendiente,"REPROGRAMADA");
     programarReintento(id,r,ahora);
     registrarEvento(p,Accion.PROGRAMACION_RECLUTAMIENTO,r.modalidadActividad(),"Llamada de seguimiento programada",r.fechaHoraGestion());
     resultado="Seguimiento programado";
    } else {
     if(pendiente!=null && pendiente.getTipo().equals("REINTENTO")) cerrar(pendiente,"REALIZADA");
     resultado="Contacto efectivo · seguimiento";
    }
   }
   case "AGENDAR_MEET", "REPROGRAMAR_MEET", "AGENDAR", "REPROGRAMAR" -> {
    boolean reprogramar=r.accion().equals("REPROGRAMAR_MEET")||r.accion().equals("REPROGRAMAR");
    if(reprogramar&&pendiente==null) throw new BadRequestException("No hay una actividad pendiente para reprogramar.");
    if(!reprogramar&&pendiente!=null) throw new BadRequestException("Ya existe una actividad pendiente. Utiliza reprogramar.");
    if(pendiente!=null) cerrar(pendiente,"REPROGRAMADA");
    if(r.idHorarioMeet()!=null||r.fechaMeet()!=null||r.accion().endsWith("_MEET")) {
     SesionMeetReclutamiento sesion=programarMeet(id,p,r);
     tipificar(id,"INTERESADO","AGENDADO",r);
     registrarEvento(p,reprogramar?Accion.REPROGRAMACION_RECLUTAMIENTO:Accion.PROGRAMACION_RECLUTAMIENTO,ModalidadContacto.MEET,
      (reprogramar?"Meet reprogramado":"Meet programado")+" para "+sesion.getFechaHoraInicio(),r.fechaHoraGestion());
     resultado=reprogramar?"Meet reprogramado":"Meet programado";
    } else {
     programar(id,"ENTREVISTA",r,ahora);
     tipificar(id,"INTERESADO","AGENDADO",r);
     registrarEvento(p,Accion.PROGRAMACION_RECLUTAMIENTO,r.modalidadActividad(),"Actividad programada",r.fechaHoraGestion());
     resultado=reprogramar?"Actividad reprogramada":"Entrevista programada";
    }
   }
   case "ASISTIO_MEET" -> {
    exigirMeetPendiente(pendiente);
    if(pendiente.getFechaHora().isAfter(r.fechaHoraGestion())) throw new BadRequestException("No puedes registrar asistencia antes del Meet.");
    cerrar(pendiente,"REALIZADA");
    registrarEvento(p,Accion.ASISTENCIA_MEET,ModalidadContacto.MEET,"El postulante asistió al Meet",r.fechaHoraGestion());
    resultado="Asistencia al Meet registrada";
   }
   case "INASISTENCIA" -> {
    exigirMeetPendiente(pendiente);
    if(pendiente.getFechaHora().isAfter(r.fechaHoraGestion())) throw new BadRequestException("No puedes registrar inasistencia antes del Meet.");
    exigirObservacion(r); cerrar(pendiente,"INASISTENCIA");
    registrarEvento(p,Accion.INASISTENCIA_MEET,ModalidadContacto.MEET,"No asistió al Meet · "+r.observacion().trim(),r.fechaHoraGestion());
    resultado="Inasistencia registrada";
   }
   case "CANCELAR_CITA" -> {
    if(pendiente==null) throw new BadRequestException("No hay una actividad pendiente.");
    exigirObservacion(r); cerrar(pendiente,"CANCELADA");
    registrarEvento(p,Accion.REPROGRAMACION_RECLUTAMIENTO,pendienteModalidad(pendiente),"Actividad cancelada · "+r.observacion().trim(),r.fechaHoraGestion());
    resultado="Actividad cancelada";
   }
   case "EVALUAR" -> {
    if(!tieneMeetAsistido(agenda)) throw new BadRequestException("Registra la asistencia al Meet antes de evaluar.");
    exigirObservacion(r); g.setEvaluadaAt(r.fechaHoraGestion());
    registrarEvento(p,Accion.EVALUACION_RECLUTAMIENTO,ModalidadContacto.MEET,"Evaluación del Meet registrada · "+r.observacion().trim(),r.fechaHoraGestion());
    resultado="Evaluación realizada";
   }
   case "APROBAR" -> {
    exigirObservacion(r);
     if(!tieneMeetAsistido(agenda)) throw new BadRequestException("Registra la asistencia al Meet antes de aprobar.");
    tipificar(id,"RECLUTADO","APROBADO_PENDIENTE_GRUPO",r); g.setResultadoEvaluacion("APROBADO");
    registrarEvento(p,Accion.APROBACION_RECLUTAMIENTO,ModalidadContacto.MEET,"Postulante aprobado · pendiente de grupo · "+r.observacion().trim(),r.fechaHoraGestion());
    resultado="Aprobado · pendiente de grupo";
   }
   case "RECHAZAR" -> {
    exigirObservacion(r); tipificar(id,"RECHAZADO",r.motivo(),r); g.setResultadoEvaluacion("RECHAZADO"); cerrar(pendiente,"CANCELADA");
    registrarEvento(p,Accion.RECHAZO_RECLUTAMIENTO,r.modalidadContacto(),"Postulación rechazada · "+r.observacion().trim(),r.fechaHoraGestion());
    resultado="Postulación rechazada";
   }
   case "NO_INTERESADO" -> {
    tipificar(id,"NO_INTERESADO",r.motivo(),r); cerrar(pendiente,"CANCELADA"); resultado="No desea continuar";
   }
   case "ASIGNAR_GRUPO" -> {
    exigirGrupo(r);
    if(!"APROBADO".equals(g.getResultadoEvaluacion())) throw new BadRequestException("Solo se pueden asignar postulantes aprobados.");
    grupoService.agregarPostulacion(r.idGrupoCapacitacion(),AgregarPostulacionGrupoCapacitacionRequest.builder().idPostulacion(id).build());
    resultado="Asignado a capacitación";
   }
   default -> throw new BadRequestException("Acción de gestión inválida.");
  }
  g.setRevision(g.getRevision()+1);
  g.setUltimaGestionAt(r.fechaHoraGestion());
  g.setUltimoResultado(resultado);
  gestiones.saveAndFlush(g);
  eventos.registrarEvento(p,Accion.ACTUALIZACION_POSTULACION,r.modalidadContacto(),null,null,null,null,
   resultado + (r.fechaHoraActividad()!=null ? " · Próxima actividad: "+r.fechaHoraActividad()+" · "+r.modalidadActividad()+" · "+Objects.toString(r.referencia(),"") : "")
    + (r.observacion()!=null && !r.observacion().isBlank() ? " · "+r.observacion().trim() : ""),r.fechaHoraGestion());
  realtime.publishAfterCommit("GESTION_RECLUTAMIENTO","POSTULACION",p,p.getEtapa(),p.getEstado(),p.getEstadoBandeja(),null,p.getPuestoObjetivo());
  return obtener(id);
 }

 private List<String> acciones(Etapa etapa,EstadoPostulacion estado,GestionReclutamiento g,List<ActividadReclutamiento> agenda) {
  if(etapa!=Etapa.RECLUTAMIENTO || estado!=EstadoPostulacion.EN_PROCESO) return List.of();
  var result=new ArrayList<>(List.of("NO_CONTACTO","SEGUIMIENTO","NO_INTERESADO"));
  var pendiente=agenda.stream().filter(a -> "PENDIENTE".equals(a.getEstado())).findFirst().orElse(null);
  boolean meetAsistido=tieneMeetAsistido(agenda);
  if(pendiente!=null && "MEET".equals(pendiente.getModalidad())) {
   result.add("REPROGRAMAR_MEET"); result.add("INASISTENCIA");
   if(!pendiente.getFechaHora().isAfter(LocalDateTime.now(ZoneId.of("America/Lima")))) {
     result.add("ASISTIO_MEET");
   }
  } else if(pendiente!=null) result.add("REPROGRAMAR");
  else if(!meetAsistido && g.getEvaluadaAt()==null && g.getResultadoEvaluacion()==null) result.addAll(List.of("AGENDAR_MEET","AGENDAR"));
   if(meetAsistido && g.getResultadoEvaluacion()==null) result.addAll(List.of("APROBAR","RECHAZAR"));
  if("APROBADO".equals(g.getResultadoEvaluacion())) result.add("ASIGNAR_GRUPO");
  return result;
 }

 private void tipificar(Long id,String codigo,String motivo,GestionReclutamientoRequest r) {
  var tip=tipificaciones.findByEtapaAndCodigo(Etapa.RECLUTAMIENTO,codigo)
   .orElseThrow(() -> new BadRequestException("El catálogo no contiene "+codigo));
  if(motivo==null || motivo.isBlank()) throw new BadRequestException("Selecciona un motivo.");
  var sub=subtipificaciones.findByTipificacionIdAndCodigo(tip.getId(),motivo)
   .orElseThrow(() -> new BadRequestException("El motivo no corresponde al resultado seleccionado."));
  postulacionService.tipificarPostulacion(id,TipificarPostulacionRequest.builder()
   .idTipificacion(tip.getId()).idSubtipificacion(sub.getId()).idGrupoCapacitacion(r.idGrupoCapacitacion())
   .modalidadContacto(r.modalidadContacto()).fechaHoraGestion(r.fechaHoraGestion()).observacion(r.observacion()).build());
 }
 private SesionMeetReclutamiento programarMeet(Long id,Postulacion p,GestionReclutamientoRequest r) {
  if(p.getNegocio()==null) throw new BadRequestException("La postulación necesita negocio para programar un Meet.");
  if(r.fechaMeet()==null||r.idHorarioMeet()==null) throw new BadRequestException("Selecciona una fecha y un horario de Meet.");
  SesionMeetReclutamiento sesion=meetService.obtenerOCrearSesion(r.idHorarioMeet(),r.fechaMeet(),p.getNegocio());
  ActividadReclutamiento a=new ActividadReclutamiento();
  a.setPostulacionId(id); a.setTipo("ENTREVISTA"); a.setModalidad(ModalidadContacto.MEET.name());
  a.setFechaHora(sesion.getFechaHoraInicio()); a.setReferencia(sesion.getEnlace()); a.setMeetSesionId(sesion.getId());
  a.setEstado("PENDIENTE"); a.setResponsableId(currentUser.empleadoID()); actividades.saveAndFlush(a);
  return sesion;
 }
 private void programarReintento(Long id,GestionReclutamientoRequest r,LocalDateTime ahora) {
  if(r.fechaHoraActividad()==null||r.modalidadActividad()==null) throw new BadRequestException("Indica fecha, hora y canal de la próxima llamada.");
  if(!r.fechaHoraActividad().isAfter(ahora)||!r.fechaHoraActividad().isAfter(r.fechaHoraGestion())) throw new BadRequestException("La próxima llamada debe tener una fecha y hora futuras.");
  if(r.modalidadActividad()!=ModalidadContacto.LLAMADA&&r.modalidadActividad()!=ModalidadContacto.WHATSAPP) throw new BadRequestException("El seguimiento solo puede programarse por llamada o WhatsApp.");
  ActividadReclutamiento a=new ActividadReclutamiento(); a.setPostulacionId(id); a.setTipo("REINTENTO");
  a.setModalidad(r.modalidadActividad().name()); a.setFechaHora(r.fechaHoraActividad()); a.setReferencia(r.referencia());
  a.setEstado("PENDIENTE"); a.setResponsableId(currentUser.empleadoID()); actividades.saveAndFlush(a);
 }
 private boolean tieneMeetAsistido(List<ActividadReclutamiento> agenda) {
  return agenda.stream().anyMatch(a -> "ENTREVISTA".equals(a.getTipo())&&"MEET".equals(a.getModalidad())&&"REALIZADA".equals(a.getEstado()));
 }
 private void exigirMeetPendiente(ActividadReclutamiento a) {
  if(a==null||!"ENTREVISTA".equals(a.getTipo())||!"MEET".equals(a.getModalidad())) throw new BadRequestException("No hay un Meet pendiente para registrar.");
 }
 private ModalidadContacto pendienteModalidad(ActividadReclutamiento a) {
  if(a==null||a.getModalidad()==null) return null;
  try { return ModalidadContacto.valueOf(a.getModalidad()); } catch(IllegalArgumentException ignored) { return null; }
 }
 private void exigirGrupo(GestionReclutamientoRequest r) {
  if(r.idGrupoCapacitacion()==null) throw new BadRequestException("Selecciona un grupo de capacitación.");
 }
 private void registrarEvento(Postulacion p,Accion accion,ModalidadContacto modalidad,String observacion,LocalDateTime fechaHora) {
  eventos.registrarEvento(p,accion,modalidad,null,null,null,null,observacion,fechaHora);
 }
 private void programar(Long id,String tipo,GestionReclutamientoRequest r,LocalDateTime ahora) {
  if(r.fechaHoraActividad()==null || r.modalidadActividad()==null)
   throw new BadRequestException("Indica modalidad, fecha y hora de la próxima actividad.");
  if(!r.fechaHoraActividad().isAfter(ahora) || !r.fechaHoraActividad().isAfter(r.fechaHoraGestion()))
   throw new BadRequestException("La próxima actividad debe tener una fecha y hora futuras.");
  if(tipo.equals("ENTREVISTA") && r.modalidadActividad()==ModalidadContacto.WHATSAPP)
   throw new BadRequestException("La entrevista debe ser por llamada, Meet o presencial.");
  if((r.modalidadActividad()==ModalidadContacto.MEET || r.modalidadActividad()==ModalidadContacto.PRESENCIAL)
    && (r.referencia()==null || r.referencia().isBlank()))
   throw new BadRequestException("Indica el enlace o la ubicación de la entrevista.");
  if(r.modalidadActividad()==ModalidadContacto.MEET && !esEnlaceSeguro(r.referencia()))
   throw new BadRequestException("Indica un enlace HTTPS válido para la reunión.");
  ActividadReclutamiento a=new ActividadReclutamiento();
  a.setPostulacionId(id); a.setTipo(tipo); a.setModalidad(r.modalidadActividad().name());
  a.setFechaHora(r.fechaHoraActividad()); a.setReferencia(r.referencia()); a.setEstado("PENDIENTE");
  a.setResponsableId(currentUser.empleadoID()); actividades.saveAndFlush(a);
 }
 private boolean esEnlaceSeguro(String value) {
  try { var uri=java.net.URI.create(value.trim()); return "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost()!=null; }
  catch(IllegalArgumentException ex) { return false; }
 }
 private void cerrar(ActividadReclutamiento a,String estado) {
  if(a!=null) { a.setEstado(estado); actividades.saveAndFlush(a); }
 }
 private void exigirObservacion(GestionReclutamientoRequest r) {
  if(r.observacion()==null || r.observacion().isBlank()) throw new BadRequestException("Describe el resultado de esta gestión.");
 }
 private void validarNoContacto(GestionReclutamientoRequest r) {
  if(!r.accion().equals("NO_CONTACTO")) return;
  if(r.modalidadContacto()!=ModalidadContacto.LLAMADA && r.modalidadContacto()!=ModalidadContacto.WHATSAPP)
   throw new BadRequestException("Un intento sin contacto solo puede registrarse por llamada o WhatsApp.");
  if(r.fechaHoraActividad()!=null || r.modalidadActividad()!=null || (r.referencia()!=null && !r.referencia().isBlank()))
   throw new BadRequestException("Un intento sin contacto no puede programar una próxima actividad.");
 }
 private GestionReclutamiento inicial(Long id) {
  var g=new GestionReclutamiento(); g.setPostulacionId(id); return g;
 }
}

