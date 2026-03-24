package pe.albrugroup.recruitment_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.recruitment_service.entity.Evento;

import java.util.List;

public interface EventoRepository extends JpaRepository<Evento, Long> {

    List<Evento> findByPostulacionIdOrderByCreatedAtDescIdDesc(Long idPostulacion);
}
