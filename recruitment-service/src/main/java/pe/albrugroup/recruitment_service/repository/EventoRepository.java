package pe.albrugroup.recruitment_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.recruitment_service.entity.Evento;

public interface EventoRepository extends JpaRepository<Evento, Long> {

    Page<Evento> findByPostulacionId(Long idPostulacion, Pageable pageable);
}
