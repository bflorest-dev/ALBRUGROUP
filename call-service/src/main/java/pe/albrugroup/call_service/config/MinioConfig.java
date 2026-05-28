package pe.albrugroup.call_service.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class MinioConfig {

    private final MinioProperties props;
    private MinioClient client;

    @Bean
    public MinioClient minioClient() {
        client = MinioClient.builder()
                .endpoint(props.getEndpoint())
                .credentials(props.getAccessKey(), props.getSecretKey())
                .build();
        return client;
    }

    @PostConstruct
    public void ensureBucket() {
        try {
            MinioClient c = minioClient();
            boolean exists = c.bucketExists(
                    BucketExistsArgs.builder().bucket(props.getBucketRecordings()).build());
            if (!exists) {
                c.makeBucket(MakeBucketArgs.builder().bucket(props.getBucketRecordings()).build());
                log.info("MinIO bucket creado: {}", props.getBucketRecordings());
            } else {
                log.info("MinIO bucket ya existe: {}", props.getBucketRecordings());
            }
        } catch (Exception e) {
            log.warn("No se pudo asegurar bucket MinIO (sera reintentado en runtime): {}", e.getMessage());
        }
    }
}
