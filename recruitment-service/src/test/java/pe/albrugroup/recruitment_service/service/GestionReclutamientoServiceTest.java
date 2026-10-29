package pe.albrugroup.recruitment_service.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.recruitment_service.configuration.CurrentUser;
import pe.albrugroup.recruitment_service.entity.*;
import pe.albrugroup.recruitment_service.entity.enums.*;
import pe.albrugroup.recruitment_service.entity.request.GestionReclutamientoRequest;
import pe.albrugroup.recruitment_service.entity.response.PostulacionResponse;
import pe.albrugroup.recruitment_service.exception.*;
import pe.albrugroup.recruitment_service.repository.*;
import java.time.*;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GestionReclutamientoServiceTest {
 @Mock PostulacionRepository postulaciones;
 @Mock GestionReclutamientoRepository gestiones;
 @Mock ActividadReclutamientoRepository actividades;
 @Mock TipificacionRepository tipificaciones;
 @Mock SubtipificacionRepository subtipificaciones;
 @Mock PostulacionService postulacionService;
 @Mock EventoService eventos;
 @Mock PostulacionRealtimeNotifier realtime;
 @Mock CurrentUser currentUser;
 @InjectMocks GestionReclutamientoService service;
 private GestionReclutamiento gestion;
 private Postulacion postulacion;
 private LocalDateTime now;

 @BeforeEach void setup() {
  now=LocalDateTime.now(ZoneId.of("America/Lima")).withNano(0);
  gestion=new GestionReclutamiento();gestion.setPostulacionId(1L);
  postulacion=Postulacion.builder().id(1L).etapa(Etapa.RECLUTAMIENTO)
   .estado(EstadoPostulacion.EN_PROCESO).puestoObjetivo(PuestoObjetivo.ASESOR_VENTAS)
   .fechaPostulacion(now.toLocalDate().minusDays(1)).build();
 }
 private void lectura() {
  when(gestiones.findById(1L)).thenReturn(Optional.of(gestion));
  when(postulacionService.obtenerPostulacion(1L)).thenReturn(PostulacionResponse.builder()
   .id(1L).etapa(postulacion.getEtapa()).estado(postulacion.getEstado())
   .puestoObjetivo(postulacion.getPuestoObjetivo()).build());
 }
 private void escritura() {
  when(postulaciones.findLockedById(1L)).thenReturn(Optional.of(postulacion));
  when(gestiones.findById(1L)).thenReturn(Optional.of(gestion));
 }
 private GestionReclutamientoRequest request(String accion,long revision,LocalDateTime fecha) {
  return new GestionReclutamientoRequest(accion,revision,fecha,ModalidadContacto.LLAMADA,
   "Prueba",null,null,null,null,null,null,null,null);
 }
 @Test void nuevoNoPermiteAprobarNiRechazar() {
  lectura();var actions=service.obtener(1L).accionesDisponibles();
  assertFalse(actions.contains("APROBAR"));assertFalse(actions.contains("RECHAZAR"));
  assertTrue(actions.contains("AGENDAR"));assertTrue(actions.contains("NO_CONTACTO"));
 }
 @Test void asistenciaHabilitaDecisionFinalSinEvaluacionIntermedia() {
  var meet=new ActividadReclutamiento();meet.setTipo("ENTREVISTA");meet.setModalidad("MEET");
  meet.setEstado("REALIZADA");meet.setFechaHora(now.minusHours(1));
  when(actividades.findByPostulacionIdOrderByIdDesc(1L)).thenReturn(List.of(meet));
  lectura();var actions=service.obtener(1L).accionesDisponibles();
  assertTrue(actions.containsAll(List.of("APROBAR","RECHAZAR")));
  assertFalse(actions.contains("EVALUAR"));
 }
 @Test void capacitacionNoPermiteGestionReclutador() {
  postulacion.setEtapa(Etapa.CAPACITACION);lectura();
  assertTrue(service.obtener(1L).accionesDisponibles().isEmpty());
 }
 @Test void rechazaRevisionObsoletaSinEscribir() {
  escritura();gestion.setRevision(2);
  assertThrows(ConflictException.class,()->service.registrar(1L,request("EVALUAR",1,now)));
  verifyNoInteractions(eventos,realtime,tipificaciones,subtipificaciones,postulacionService);
  verify(gestiones,never()).saveAndFlush(any());
 }
 @Test void rechazaAprobacionDirectaSinEvaluacion() {
  escritura();
  assertThrows(BadRequestException.class,()->service.registrar(1L,request("APROBAR",0,now)));
  verifyNoInteractions(postulacionService,eventos,realtime);
 }
 @Test void rechazaFechaDeGestionFutura() {
  escritura();
  assertThrows(BadRequestException.class,()->service.registrar(1L,request("EVALUAR",0,now.plusDays(1))));
  verifyNoInteractions(postulacionService,eventos,realtime);
 }
 @Test void noPermiteInasistenciaAntesDeCita() {
  escritura();var cita=new ActividadReclutamiento();cita.setTipo("ENTREVISTA");
  cita.setEstado("PENDIENTE");cita.setFechaHora(now.plusDays(1));
  when(actividades.findByPostulacionIdOrderByIdDesc(1L)).thenReturn(List.of(cita));
  assertThrows(BadRequestException.class,()->service.registrar(1L,request("INASISTENCIA",0,now)));
  assertEquals("PENDIENTE",cita.getEstado());verify(actividades,never()).saveAndFlush(any());
 }
 @Test void noContactoSoloAdmiteLlamadaOWhatsapp() {
  escritura();
  var request=new GestionReclutamientoRequest("NO_CONTACTO",0L,now,ModalidadContacto.MEET,
   "", "SIN_RESPUESTA", null,null,null,null,null,null,null);
  assertThrows(BadRequestException.class,()->service.registrar(1L,request));
  verifyNoInteractions(eventos,tipificaciones,subtipificaciones,postulacionService);
 }
 @Test void noContactoNoPermiteProgramarActividad() {
  escritura();
  var request=new GestionReclutamientoRequest("NO_CONTACTO",0L,now,ModalidadContacto.LLAMADA,
   "", "SIN_RESPUESTA", now.plusHours(2),ModalidadContacto.LLAMADA,null,null,null,null,null);
  assertThrows(BadRequestException.class,()->service.registrar(1L,request));
  verifyNoInteractions(eventos,tipificaciones,subtipificaciones,postulacionService);
 }
}
