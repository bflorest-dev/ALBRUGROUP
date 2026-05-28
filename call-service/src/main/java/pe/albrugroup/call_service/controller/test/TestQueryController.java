package pe.albrugroup.call_service.controller.test;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.call_service.asterisk.storage.MinioStorageService;
import pe.albrugroup.call_service.entity.Call;
import pe.albrugroup.call_service.entity.CallEvent;
import pe.albrugroup.call_service.entity.Recording;
import pe.albrugroup.call_service.repository.CallEventRepository;
import pe.albrugroup.call_service.repository.CallRepository;
import pe.albrugroup.call_service.repository.RecordingRepository;

import java.util.List;
import java.util.Map;

/**
 * Endpoints de consulta para verificar manualmente lo que call-service escribio
 * en la base mientras Asterisk emitia eventos.
 */
@RestController
@RequestMapping("/test/query")
@RequiredArgsConstructor
public class TestQueryController {

    private final CallRepository callRepo;
    private final CallEventRepository eventRepo;
    private final RecordingRepository recRepo;
    private final MinioStorageService minioStorage;

    @GetMapping("/calls")
    public Page<Call> calls(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return callRepo.findAll(PageRequest.of(page, size));
    }

    @GetMapping("/calls/{id}/events")
    public List<CallEvent> eventsOfCall(@RequestParam Long id) {
        return eventRepo.findByCall_IdOrderByOcurridoEnAsc(id);
    }

    @GetMapping("/recordings")
    public List<Recording> recordings() {
        return recRepo.findAll();
    }

    @GetMapping("/recordings/{id}/url")
    public Map<String, String> recordingUrl(@RequestParam Long id) {
        Recording r = recRepo.findById(id).orElseThrow();
        return Map.of("presignedUrl", minioStorage.presignedGet(r.getStorageObjectKey()));
    }
}
