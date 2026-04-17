package pe.albrugroup.recruitment_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.recruitment_service.entity.OfertaLaboral;
import pe.albrugroup.recruitment_service.entity.enums.EstadoOferta;
import pe.albrugroup.recruitment_service.entity.enums.Modalidad;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;
import pe.albrugroup.recruitment_service.entity.enums.PuestoObjetivo;
import pe.albrugroup.recruitment_service.entity.enums.TurnoHorario;

@Repository
public interface OfertaLaboralRepository extends JpaRepository<OfertaLaboral, Long> {

    boolean existsByCodigo(String codigo);

    boolean existsByEstadoAndNegocioAndPuestoObjetivoAndModalidadAndHorario(
            EstadoOferta estado,
            Negocio negocio,
            PuestoObjetivo puestoObjetivo,
            Modalidad modalidad,
            TurnoHorario horario
    );

    @EntityGraph(attributePaths = "ampliaciones")
    java.util.List<OfertaLaboral> findByEstadoOrderByCreatedAtDesc(EstadoOferta estado);

    Page<OfertaLaboral> findByEstado(EstadoOferta estado, Pageable pageable);
}
