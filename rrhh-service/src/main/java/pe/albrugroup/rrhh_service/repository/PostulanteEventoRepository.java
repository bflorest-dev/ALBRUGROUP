package pe.albrugroup.rrhh_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.rrhh_service.entity.PostulanteEvento;

@Repository
public interface PostulanteEventoRepository extends JpaRepository<PostulanteEvento, Long> {

}
