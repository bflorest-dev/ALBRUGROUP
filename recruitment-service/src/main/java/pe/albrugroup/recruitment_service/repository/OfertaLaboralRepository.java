package pe.albrugroup.recruitment_service.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.recruitment_service.entity.OfertaLaboral;
import pe.albrugroup.recruitment_service.entity.enums.EstadoOferta;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;
import pe.albrugroup.recruitment_service.entity.enums.PuestoObjetivo;
import pe.albrugroup.recruitment_service.entity.enums.TurnoHorario;

import java.util.List;

@Repository
public interface OfertaLaboralRepository extends JpaRepository<OfertaLaboral, Long> {

    boolean existsByCodigo(String codigo);

    boolean existsByEstadoAndNegocioAndPuestoObjetivoAndHorario(
            EstadoOferta estado,
            Negocio negocio,
            PuestoObjetivo puestoObjetivo,
            TurnoHorario horario
    );

    @EntityGraph(attributePaths = "ampliaciones")
    List<OfertaLaboral> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "ampliaciones")
    List<OfertaLaboral> findByEstadoOrderByCreatedAtDesc(EstadoOferta estado);
}
