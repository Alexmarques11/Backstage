FROM eclipse-temurin:20-jdk-alpine

WORKDIR /app

COPY build/libs/fat.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
