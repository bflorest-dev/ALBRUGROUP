package pe.albrugroup.rrhh_service.usecase;

import org.springframework.stereotype.Component;
import pe.albrugroup.rrhh_service.entity.enums.EtapaProceso;
import pe.albrugroup.rrhh_service.entity.enums.Origen;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.rrhh_service.entity.request.postulante.EstadoCapacitacionRequest;
import pe.albrugroup.rrhh_service.entity.request.postulante.EstadoReclutamientoRequest;
import pe.albrugroup.rrhh_service.entity.request.postulante.RegistrarPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.response.PostulanteResponse;

import java.time.LocalDate;
import java.util.List;

public interface IPostulante {

    PostulanteResponse registrarPostulante(RegistrarPostulanteRequest nuevoPostulante);

    List<PostulanteResponse> getPostulantesFiltrados(
            EtapaProceso etapaProceso, String estadoProceso, String subestadoProceso,
            Origen origen, PuestoTrabajo puestoTrabajo, LocalDate desde, LocalDate hasta, Boolean listaNegra);

    PostulanteResponse actualizarEstadoReclutamiento(EstadoReclutamientoRequest estado);
    List<PostulanteResponse> actualizarEstadosCapacitacion(List<EstadoCapacitacionRequest> postulantesEstados);

//    PostulanteResponse actulizarPostulante(Long idPostulante, DatosPostulanteRequest infoPostulante);
//    List<PostulanteResponse> actualizarEstadosPostulacion(CambiosEstadoPostulacionRequest cambios);
}
