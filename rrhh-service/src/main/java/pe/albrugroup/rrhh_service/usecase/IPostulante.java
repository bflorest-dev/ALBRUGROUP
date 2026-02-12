package pe.albrugroup.rrhh_service.usecase;

import org.springframework.stereotype.Component;
import pe.albrugroup.rrhh_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.rrhh_service.entity.request.CambiosEstadoPostulacionRequest;
import pe.albrugroup.rrhh_service.entity.request.DatosPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.request.RegistrarPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.response.PostulanteResponse;

import java.time.LocalDate;
import java.util.List;

@Component
public interface IPostulante {

    List<PostulanteResponse> getPostulantesFiltrados(
            EstadoPostulacion estado, PuestoTrabajo puesto, LocalDate desde, LocalDate hasta);
    PostulanteResponse registrarPostulante(RegistrarPostulanteRequest nuevoPostulante);
    PostulanteResponse actulizarPostulante(Long idPostulante, DatosPostulanteRequest infoPostulante);
    List<PostulanteResponse> actualizarEstadosPostulacion(CambiosEstadoPostulacionRequest cambios);
}
