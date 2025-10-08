#!/bin/bash

# Fix Gradle wrapper by downloading the gradle-wrapper.jar
cd backstage_frontend

# Create the wrapper directory if it doesn't exist
mkdir -p gradle/wrapper

# Download gradle-wrapper.jar for version 8.13
echo "Downloading gradle-wrapper.jar..."
curl -L -o gradle/wrapper/gradle-wrapper.jar \
  "https://github.com/gradle/gradle/raw/v8.1.3/gradle/wrapper/gradle-wrapper.jar"

# Make gradlew executable
chmod +x gradlew

echo "Gradle wrapper fixed!"
echo "You can now run ./gradlew build"