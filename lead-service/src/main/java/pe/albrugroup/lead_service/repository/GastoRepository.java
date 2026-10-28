package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Gasto;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface GastoRepository extends JpaRepository<Gasto, Long> {

    List<Gasto> findByTipoGastoIdAndFechaBetweenOrderByFechaDescIdDesc(
            Long idTipoGasto, LocalDate desde, LocalDate hasta);

    List<Gasto> findByFechaBetweenOrderByFechaDescIdDesc(LocalDate desde, LocalDate hasta);

    @Query("""
            SELECT g.tipoGasto.id, COALESCE(SUM(g.monto), 0), COUNT(g)
            FROM Gasto g
            WHERE g.fecha BETWEEN :desde AND :hasta
            GROUP BY g.tipoGasto.id
            """)
    List<Object[]> acumuladoPorTipo(LocalDate desde, LocalDate hasta);
}
