package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Contacto;

import java.util.Optional;

@Repository
public interface ContactoRepository extends JpaRepository<Contacto, Long> {

    Optional<Contacto> findByPrefijoAndLead(String prefijo, String lead);
}
