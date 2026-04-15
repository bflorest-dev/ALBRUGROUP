package pe.albrugroup.rrhh_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.rrhh_service.entity.Evento;

import java.util.List;

public interface EventoRepository extends JpaRepository<Evento, Long> {
    Page<Evento> findByEmpleadoId(Long idEmpleado, Pageable pageable);
}
