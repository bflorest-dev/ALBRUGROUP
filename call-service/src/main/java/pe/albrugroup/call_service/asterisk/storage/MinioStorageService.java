package pe.albrugroup.call_service.asterisk.storage;

import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.UploadObjectArgs;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import pe.albrugroup.call_service.config.MinioProperties;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

/**
 * Sube las grabaciones desde el filesystem local de Asterisk hacia MinIO
 * y emite URLs presignadas para reproduccion.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MinioStorageService {

    private final MinioClient minioClient;
    private final MinioProperties props;

    /**
     * Sube un archivo local al bucket de grabaciones.
     * @param localPath ruta local (ej. /var/spool/asterisk/recording/abc.wav)
     * @param objectKey clave en MinIO (ej. "2026/05/27/abc.wav")
     * @return objectKey
     */
    public String upload(Path localPath, String objectKey) {
        try {
            String contentType = Files.probeContentType(localPath);
            if (contentType == null) contentType = "audio/wav";

            minioClient.uploadObject(UploadObjectArgs.builder()
                    .bucket(props.getBucketRecordings())
                    .object(objectKey)
                    .filename(localPath.toString())
                    .contentType(contentType)
                    .build());

            log.info("Grabacion subida a MinIO: {}", objectKey);
            return objectKey;
        } catch (Exception e) {
            log.error("Error subiendo grabacion {} a MinIO: {}", localPath, e.getMessage());
            throw new RuntimeException("Error uploading recording", e);
        }
    }

    /** URL presignada GET con TTL configurable. */
    public String presignedGet(String objectKey) {
        try {
            return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(props.getBucketRecordings())
                    .object(objectKey)
                    .expiry(props.getPresignedUrlTtlMinutes(), TimeUnit.MINUTES)
                    .build());
        } catch (Exception e) {
            throw new RuntimeException("Error generando presigned URL", e);
        }
    }
}
