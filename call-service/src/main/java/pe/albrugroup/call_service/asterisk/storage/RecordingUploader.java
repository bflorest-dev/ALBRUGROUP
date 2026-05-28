package pe.albrugroup.call_service.asterisk.storage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.call_service.config.AsteriskProperties;
import pe.albrugroup.call_service.entity.Call;
import pe.albrugroup.call_service.entity.Recording;
import pe.albrugroup.call_service.entity.enums.FormatoGrabacion;
import pe.albrugroup.call_service.repository.CallRepository;
import pe.albrugroup.call_service.repository.RecordingRepository;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

/**
 * Job que cada N segundos revisa el spool de Asterisk y sube los .wav nuevos a MinIO.
 *
 * Convencion: MixMonitor escribe el archivo como ${UNIQUEID}.wav, por lo que el
 * basename SIN extension matchea con Call.uniqueId. Eso permite asociar la grabacion
 * a su llamada sin parsear nada del evento ARI/AMI.
 *
 * Reglas:
 *  - Solo procesar archivos que no esten siendo escritos (mtime estable > 5s).
 *  - Idempotente: si ya hay Recording con ese filename, se ignora.
 *  - Si esta habilitado deleteAfterUpload, se borra el archivo local tras subirlo.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RecordingUploader {

    private static final long STABLE_MTIME_MILLIS = 5_000L;
    private static final DateTimeFormatter DATE_PATH = DateTimeFormatter.ofPattern("yyyy/MM/dd");

    private final AsteriskProperties props;
    private final MinioStorageService minio;
    private final RecordingRepository recordingRepo;
    private final CallRepository callRepo;

    @Scheduled(fixedDelayString = "${app.recording.uploader-interval-ms:15000}",
               initialDelay = 20_000L)
    public void scanAndUpload() {
        Path dir = Paths.get(props.getRecording().getLocalSpoolDir());
        if (!Files.isDirectory(dir)) {
            log.debug("Spool de grabaciones no existe aun: {}", dir);
            return;
        }

        try (DirectoryStream<Path> stream = Files.newDirectoryStream(dir, "*.wav")) {
            for (Path file : stream) {
                try {
                    processFile(file);
                } catch (Exception e) {
                    log.warn("Error procesando grabacion {}: {}", file, e.getMessage());
                }
            }
        } catch (IOException e) {
            log.error("No se pudo abrir el spool {}: {}", dir, e.getMessage());
        }
    }

    @Transactional
    protected void processFile(Path file) throws Exception {
        String filename = file.getFileName().toString();
        // Si ya esta registrado, no hacer nada (idempotencia).
        if (recordingRepo.findByFilename(filename).isPresent()) return;

        // Esperar a que el archivo este estable (no en proceso de escritura).
        long mtime = Files.getLastModifiedTime(file).toMillis();
        if (System.currentTimeMillis() - mtime < STABLE_MTIME_MILLIS) {
            log.debug("Skip (mtime reciente): {}", filename);
            return;
        }

        long sizeBytes = Files.size(file);
        if (sizeBytes == 0) {
            log.debug("Skip (archivo vacio): {}", filename);
            return;
        }

        // basename sin .wav = uniqueId del canal grabado
        String basename = filename.endsWith(".wav")
                ? filename.substring(0, filename.length() - 4)
                : filename;

        // objectKey en MinIO: recordings/yyyy/MM/dd/{filename}
        String datePath = LocalDate.now(ZoneOffset.UTC).format(DATE_PATH);
        String objectKey = datePath + "/" + filename;

        // Subir a MinIO
        minio.upload(file, objectKey);

        // Calcular hash para integridad
        String sha256 = sha256(file);

        // Asociar a Call si existe (puede no encontrar match si MixMonitor lo lanzo
        // antes de que llegara cualquier evento; en ese caso queda sin call y se
        // puede reconciliar luego).
        Call call = callRepo.findByUniqueId(basename).orElse(null);

        Recording r = Recording.builder()
                .call(call)
                .filename(filename)
                .formato(FormatoGrabacion.WAV)
                .sizeBytes(sizeBytes)
                .storageObjectKey(objectKey)
                .hashSha256(sha256)
                // Politica Fase 1: disponible 1 año (regla legal Peru Ley 29733 = al menos 6 meses).
                .disponibleHasta(Instant.now().plusSeconds(60L * 60 * 24 * 365))
                .build();
        recordingRepo.save(r);

        log.info("Grabacion registrada: filename={} call={} size={}B sha256={}",
                filename, call != null ? call.getId() : "null", sizeBytes, sha256.substring(0, 12));

        if (props.getRecording().isDeleteAfterUpload()) {
            try {
                Files.delete(file);
            } catch (IOException e) {
                log.warn("No se pudo borrar grabacion local {}: {}", file, e.getMessage());
            }
        }
    }

    private static String sha256(Path file) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        try (var in = Files.newInputStream(file)) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) md.update(buf, 0, n);
        }
        byte[] digest = md.digest();
        StringBuilder sb = new StringBuilder(digest.length * 2);
        for (byte b : digest) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}
