package pe.albrugroup.schedule_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.schedule_service.entity.PoliticaModalidad;
import pe.albrugroup.schedule_service.entity.enums.ModalidadContrato;

import java.util.Optional;

public interface PoliticaModalidadRepository extends JpaRepository<PoliticaModalidad, Long> {
    Optional<PoliticaModalidad> findByModalidad(ModalidadContrato modalidad);
}
