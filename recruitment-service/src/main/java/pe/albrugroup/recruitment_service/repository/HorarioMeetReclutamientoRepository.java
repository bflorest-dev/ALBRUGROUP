package pe.albrugroup.recruitment_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.recruitment_service.entity.HorarioMeetReclutamiento;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;

import java.util.List;

public interface HorarioMeetReclutamientoRepository extends JpaRepository<HorarioMeetReclutamiento, Long> {
    List<HorarioMeetReclutamiento> findByNegocioAndActivoTrueOrderByHoraInicioAsc(Negocio negocio);
}
