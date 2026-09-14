package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Contacto;

import java.util.Optional;

@Repository
public interface ContactoRepository extends JpaRepository<Contacto, Long> {

    Optional<Contacto> findByPrefijoAndLead(String prefijo, String lead);
    Optional<Contacto> findByUsermetaIgnoreCase(String usermeta);

    // Actualiza el teléfono (prefijo+lead) de un contacto. El unique uq_contacto_prefijo_lead es
    // DEFERRABLE INITIALLY DEFERRED (V63), por lo que dos llamadas consecutivas dentro de la misma
    // @Transactional no chocan: la validación ocurre al COMMIT, no fila a fila.
    @Modifying
    @Query("UPDATE Contacto c SET c.prefijo = :prefijo, c.lead = :lead WHERE c.id = :idContacto")
    int actualizarTelefono(
            @Param("idContacto") Long idContacto,
            @Param("prefijo") String prefijo,
            @Param("lead") String lead
    );
}
