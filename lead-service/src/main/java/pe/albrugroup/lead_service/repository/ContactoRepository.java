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

    // Setea el teléfono (prefijo+lead) de un contacto en un statement propio. La unicidad
    // (prefijo,lead) es NON-DEFERRABLE y Postgres la valida por fila dentro del statement, así que un
    // swap A↔B se hace en 3 pasos con centinela NULL (los NULL son distintos en el índice único):
    // liberar A (lead=NULL) → B toma el de A → A toma el de B. Ver intercambiarTelefonoContactos.
    @Modifying
    @Query("UPDATE Contacto c SET c.prefijo = :prefijo, c.lead = :lead WHERE c.id = :idContacto")
    int actualizarTelefono(
            @Param("idContacto") Long idContacto,
            @Param("prefijo") String prefijo,
            @Param("lead") String lead
    );
}
