package pe.albrugroup.billing_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.billing_service.entity.MatrizCalculoPlanilla;

import java.util.Optional;

public interface MatrizCalculoPlanillaRepository extends JpaRepository<MatrizCalculoPlanilla, Long> {

    Optional<MatrizCalculoPlanilla> findByActivaTrue();

    Optional<MatrizCalculoPlanilla> findTopByOrderByVersionDesc();
}
