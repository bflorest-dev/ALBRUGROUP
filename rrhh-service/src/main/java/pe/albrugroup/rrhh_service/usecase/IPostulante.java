package pe.albrugroup.rrhh_service.usecase;

import org.springframework.stereotype.Component;
import pe.albrugroup.rrhh_service.entity.enums.EtapaProceso;
import pe.albrugroup.rrhh_service.entity.enums.Origen;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.rrhh_service.entity.request.postulante.RegistrarPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.response.PostulanteResponse;

import java.time.LocalDate;
import java.util.List;

@Component
public interface IPostulante {

    PostulanteResponse registrarPostulante(RegistrarPostulanteRequest nuevoPostulante, Long responsableId);

    List<PostulanteResponse> getPostulantesFiltrados(
            EtapaProceso etapaProceso, String estadoProceso, String subestadoProceso,
            Origen origen, PuestoTrabajo puestoTrabajo, LocalDate desde, LocalDate hasta, Boolean listaNegra);

//    PostulanteResponse actulizarPostulante(Long idPostulante, DatosPostulanteRequest infoPostulante);
//    List<PostulanteResponse> actualizarEstadosPostulacion(CambiosEstadoPostulacionRequest cambios);
}
