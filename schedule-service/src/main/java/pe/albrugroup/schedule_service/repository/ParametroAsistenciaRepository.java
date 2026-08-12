package pe.albrugroup.schedule_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.schedule_service.entity.ParametroAsistencia;

import java.util.List;
import java.util.Optional;

public interface ParametroAsistenciaRepository extends JpaRepository<ParametroAsistencia, Long> {

    /** Filas especificas por rol (sin equipo). El equipo se difiere (Fork 3). */
    List<ParametroAsistencia> findByRolInAndIdEquipoIsNull(List<String> roles);

    /** Fila global (rol y equipo nulos). */
    Optional<ParametroAsistencia> findFirstByRolIsNullAndIdEquipoIsNull();
}
