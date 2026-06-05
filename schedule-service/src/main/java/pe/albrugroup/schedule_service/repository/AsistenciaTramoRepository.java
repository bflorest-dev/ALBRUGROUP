package pe.albrugroup.schedule_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.schedule_service.entity.AsistenciaTramo;

import java.util.Collection;
import java.util.List;

public interface AsistenciaTramoRepository extends JpaRepository<AsistenciaTramo, Long> {

    List<AsistenciaTramo> findByAsistenciaIdOrderByIdAsc(Long asistenciaId);

    List<AsistenciaTramo> findByAsistenciaIdInOrderByAsistenciaIdAscIdAsc(Collection<Long> asistenciaIds);
}
