package pe.albrugroup.recruitment_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.recruitment_service.entity.Tipificacion;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;

import java.util.List;
import java.util.Optional;

public interface TipificacionRepository extends JpaRepository<Tipificacion, Long> {

    List<Tipificacion> findByEtapaAndActivoTrueOrderByOrdenAsc(Etapa etapa);

    boolean existsByEtapaAndCodigoIgnoreCase(Etapa etapa, String codigo);

    Optional<Tipificacion> findByEtapaAndCodigo(Etapa etapa, String codigo);
}
