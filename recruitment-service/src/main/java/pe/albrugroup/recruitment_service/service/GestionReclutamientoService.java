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

 @Transactional(readOnly=true)
 public GestionReclutamientoResponse obtener(Long id) {
  PostulacionResponse p = postulacionService.obtenerPostulacion(id);
  GestionReclutamiento g = gestiones.findById(id).orElseGet(() -> inicial(id));
  List<ActividadReclutamiento> agenda = actividades.findByPostulacionIdOrderByIdDesc(id);
  return new GestionReclutamientoResponse(p,g.getRevision(),g.getEvaluadaAt(),g.getUltimaGestionAt(),
   g.getUltimoResultado(),acciones(p.getEtapa(),p.getEstado(),p.getPuestoObjetivo(),g,agenda),agenda);
 }

 public GestionReclutamientoResponse registrar(Long id, GestionReclutamientoRequest r) {
  Postulacion p = postulaciones.findLockedById(id).orElseThrow(() -> new NotFoundException(Postulacion.class,id));
  GestionReclutamiento g = gestiones.findById(id).orElseGet(() -> inicial(id));
  if (g.getRevision()!=r.revision()) throw new ConflictException("La ficha cambió. Actualiza el detalle antes de guardar.");
  List<ActividadReclutamiento> agenda = actividades.findByPostulacionIdOrderByIdDesc(id);
  if (!acciones(p.getEtapa(),p.getEstado(),p.getPuestoObjetivo(),g,agenda).contains(r.accion()))
   throw new BadRequestException("Esta acción no está disponible en el estado actual de la postulación.");
  LocalDateTime ahora = LocalDateTime.now(ZoneId.of("America/Lima"));
  if(r.fechaHoraGestion().isAfter(ahora.plusMinutes(5)))
   throw new BadRequestException("La fecha de gestión no puede estar en el futuro. Usa la fecha de próxima actividad.");
  if(r.fechaHoraGestion().toLocalDate().isBefore(p.getFechaPostulacion()))
   throw new BadRequestException("La gestión no puede ser anterior a la fecha de postulación.");
  if(g.getUltimaGestionAt()!=null && r.fechaHoraGestion().isBefore(g.getUltimaGestionAt()))
   throw new BadRequestException("La gestión no puede ser anterior a la última gestión registrada.");
  ActividadReclutamiento pendiente = agenda.stream().filter(a -> a.getEstado().equals("PENDIENTE")).findFirst().orElse(null);
  String resultado;
  switch(r.accion()) {
   case "NO_CONTACTO" -> {
    tipificar(id,"SIN_CONTACTO",r.motivo(),r);
    if(r.fechaHoraActividad()!=null) {
     cerrar(pendiente,"REPROGRAMADA");
     programar(id,"REINTENTO",r,ahora);
    }
    resultado="Intento sin contacto";
   }
   case "SEGUIMIENTO" -> {
    tipificar(id,"INTERESADO","SEGUIMIENTO",r);
    if(r.fechaHoraActividad()!=null) {
     cerrar(pendiente,"REPROGRAMADA");
     programar(id,"REINTENTO",r,ahora);
    } else if(pendiente!=null && pendiente.getTipo().equals("REINTENTO")) cerrar(pendiente,"REALIZADA");
    resultado="Contacto efectivo · seguimiento";
   }
   case "AGENDAR", "REPROGRAMAR" -> {
    if(r.accion().equals("AGENDAR") && pendiente!=null)
     throw new BadRequestException("Ya existe una actividad pendiente. Utiliza Reprogramar.");
    if(r.accion().equals("REPROGRAMAR") && pendiente==null)
     throw new BadRequestException("No hay una actividad pendiente para reprogramar.");
    String tipo=pendiente==null ? "ENTREVISTA" : pendiente.getTipo();
    cerrar(pendiente,"REPROGRAMADA");
    programar(id,tipo,r,ahora);
    g.setEvaluadaAt(null);
    tipificar(id,"INTERESADO","AGENDADO",r);
    resultado=r.accion().equals("AGENDAR") ? "Entrevista programada" : "Actividad reprogramada";
   }
   case "INASISTENCIA", "CANCELAR_CITA" -> {
    if(pendiente==null) throw new BadRequestException("No hay una actividad pendiente.");
    if(r.accion().equals("INASISTENCIA") && pendiente.getFechaHora().isAfter(r.fechaHoraGestion()))
     throw new BadRequestException("No puedes registrar inasistencia antes de la cita.");
    exigirObservacion(r);
    cerrar(pendiente,r.accion().equals("INASISTENCIA") ? "INASISTENCIA" : "CANCELADA");
    resultado=r.accion().equals("INASISTENCIA") ? "Inasistencia registrada" : "Actividad cancelada";
   }
   case "EVALUAR" -> {
    exigirObservacion(r);
    cerrar(pendiente,"REALIZADA");
    g.setEvaluadaAt(r.fechaHoraGestion());
    tipificar(id,"INTERESADO","SEGUIMIENTO",r);
    resultado="Evaluación realizada";
   }
   case "RECHAZAR", "NO_INTERESADO", "APROBAR" -> {
    exigirObservacion(r);
    if(r.accion().equals("APROBAR")) tipificar(id,"RECLUTADO","APTO_PARA_CAPACITACION",r);
    else tipificar(id,r.accion().equals("RECHAZAR") ? "RECHAZADO" : "NO_INTERESADO",r.motivo(),r);
    cerrar(pendiente,"CANCELADA");
    resultado=switch(r.accion()) {
     case "APROBAR" -> "Aprobado y asignado a capacitación";
     case "RECHAZAR" -> "Postulación rechazada";
     default -> "No desea continuar";
    };
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

 private List<String> acciones(Etapa etapa,EstadoPostulacion estado,PuestoObjetivo puesto,GestionReclutamiento g,List<ActividadReclutamiento> agenda) {
  if(etapa!=Etapa.RECLUTAMIENTO || estado!=EstadoPostulacion.EN_PROCESO) return List.of();
  var result=new ArrayList<>(List.of("NO_CONTACTO","SEGUIMIENTO","NO_INTERESADO","EVALUAR"));
  var pendiente=agenda.stream().filter(a -> a.getEstado().equals("PENDIENTE")).findFirst();
  if(pendiente.isPresent()) {
   result.addAll(List.of("REPROGRAMAR","CANCELAR_CITA"));
   if(pendiente.get().getTipo().equals("ENTREVISTA")) result.add("INASISTENCIA");
  } else result.add("AGENDAR");
  if(g.getEvaluadaAt()!=null) {
   result.add("RECHAZAR");
   if(puesto==PuestoObjetivo.ASESOR_VENTAS) result.add("APROBAR");
  }
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
 private GestionReclutamiento inicial(Long id) {
  var g=new GestionReclutamiento(); g.setPostulacionId(id); return g;
 }
}

