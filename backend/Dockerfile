# Use the official .NET 9 SDK image for building
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build-env
WORKDIR /app

# Copy csproj and restore as distinct layers
COPY *.csproj ./
RUN dotnet restore

# Copy everything else and build
COPY . ./
RUN dotnet publish -c Production -o out

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app

# Install required system dependencies for SkiaSharp and QuestPDF
RUN apt-get update && apt-get install -y \
    libfontconfig1 \
    libfreetype6 \
    libgdiplus \
    libx11-6 \
    libxext6 \
    libxrender1 \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the build output
COPY --from=build-env /app/out .

# Create uploads directory
RUN mkdir -p /app/uploads/profile-photos
RUN mkdir -p /app/uploads/learner-documents
RUN mkdir -p /app/uploads/assessment-answers

# Set environment variables
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:$PORT

# Expose port (Railway automatically assigns PORT)
EXPOSE $PORT

ENTRYPOINT ["dotnet", "backend.dll"]