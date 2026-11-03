package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.EquipoCampana;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EquipoCampanaRepository extends JpaRepository<EquipoCampana, Long> {

    List<EquipoCampana> findByIdEquipo(Long idEquipo);

    List<EquipoCampana> findByIdEquipoIn(Collection<Long> idEquipos);

    List<EquipoCampana> findByCampanaIdIn(Collection<Long> idCampanas);

    Optional<EquipoCampana> findByCampanaId(Long idCampana);

    boolean existsByIdEquipoAndCampanaId(Long idEquipo, Long idCampana);

    void deleteByIdEquipo(Long idEquipo);
}
