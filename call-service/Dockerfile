FROM maven:3.9.9-eclipse-temurin-21 AS builder

WORKDIR /build
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
COPY src src
RUN chmod +x mvnw && ./mvnw -q -DskipTests clean package

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
RUN apk add --no-cache wget
COPY --from=builder /build/target/call-service-0.0.1.jar app.jar

EXPOSE 8086

ENTRYPOINT ["java", "-jar", "app.jar"]
