package pe.albrugroup.schedule_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.schedule_service.entity.SesionEstado;
import pe.albrugroup.schedule_service.entity.enums.TipoSesionEstado;

import java.util.List;
import java.util.Optional;

public interface SesionEstadoRepository extends JpaRepository<SesionEstado, Long> {

    List<SesionEstado> findByAsistenciaIdOrderByInicioAsc(Long asistenciaId);

    List<SesionEstado> findByAsistenciaIdAndTipoOrderByInicioAsc(Long asistenciaId, TipoSesionEstado tipo);

    /** Sesion en curso de un tipo (fin IS NULL), si existe. */
    Optional<SesionEstado> findFirstByAsistenciaIdAndTipoAndFinIsNull(Long asistenciaId, TipoSesionEstado tipo);

    /** Cualquier sesion en curso del dia (para el control de estado unico en vivo). */
    Optional<SesionEstado> findFirstByAsistenciaIdAndFinIsNull(Long asistenciaId);
}
