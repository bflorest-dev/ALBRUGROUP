package pe.albrugroup.call_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.call_service.entity.Recording;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface RecordingRepository extends JpaRepository<Recording, Long> {

    Optional<Recording> findByFilename(String filename);

    List<Recording> findByCall_Id(Long idCall);

    List<Recording> findByDisponibleHastaBefore(Instant cutoff);
}
