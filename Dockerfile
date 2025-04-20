FROM openjdk:17-jdk-slim

WORKDIR /app

# 빌드된 JAR 파일 복사
COPY target/*.jar app.jar

# 업로드 디렉토리 생성
RUN mkdir -p /app/uploads/images

# 볼륨 설정
VOLUME /app/uploads

EXPOSE 8083

ENTRYPOINT ["java", "-jar", "app.jar"]