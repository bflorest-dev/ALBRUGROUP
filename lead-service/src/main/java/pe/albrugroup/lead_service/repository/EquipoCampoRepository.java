package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.lead_service.entity.EquipoCampo;

import java.util.Collection;
import java.util.List;

public interface EquipoCampoRepository extends JpaRepository<EquipoCampo, Long> {

    List<EquipoCampo> findByIdEquipo(Long idEquipo);

    List<EquipoCampo> findByIdEquipoIn(Collection<Long> idEquipos);

    void deleteByIdEquipo(Long idEquipo);
}
