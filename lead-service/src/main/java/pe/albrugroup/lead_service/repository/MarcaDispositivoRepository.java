package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.MarcaDispositivo;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarcaDispositivoRepository extends JpaRepository<MarcaDispositivo, Long> {

    List<MarcaDispositivo> findByActivoTrueOrderByNombreAsc();

    Optional<MarcaDispositivo> findByNombreIgnoreCase(String nombre);
}
