package pe.albrugroup.call_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.call_service.entity.CallEvent;

import java.util.List;

@Repository
public interface CallEventRepository extends JpaRepository<CallEvent, Long> {

    List<CallEvent> findByCall_IdOrderByOcurridoEnAsc(Long idCall);
}
