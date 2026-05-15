# File: CCNLTHD/social-api/Dockerfile

# Bước 1: Build file .jar với Maven và Java 21
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
# Tải thư viện trước để cache chạy cho lẹ ở các lần sau
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

# Bước 2: Chạy ứng dụng với JDK 21
FROM eclipse-temurin:21-jdk
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]