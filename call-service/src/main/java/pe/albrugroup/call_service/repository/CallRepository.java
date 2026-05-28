package pe.albrugroup.call_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.call_service.entity.Call;
import pe.albrugroup.call_service.entity.enums.CallStatus;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface CallRepository extends JpaRepository<Call, Long> {

    Optional<Call> findByUniqueId(String uniqueId);

    List<Call> findByLinkedId(String linkedId);

    Page<Call> findByIdAsesorAsignado(Long idAsesorAsignado, Pageable pageable);

    Page<Call> findByEstado(CallStatus estado, Pageable pageable);

    Page<Call> findByEndedAtBetween(Instant desde, Instant hasta, Pageable pageable);
}
