# syntax=docker/dockerfile:1

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY backend.csproj ./
RUN dotnet restore ./backend.csproj

# Copy everything else and publish
COPY . .
RUN dotnet publish ./backend.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Copy published output
COPY --from=build /app/publish .

# Configure ASP.NET Core to listen on 5213 inside container
ENV ASPNETCORE_URLS=http://0.0.0.0:5213
ENV ASPNETCORE_ENVIRONMENT=Development

EXPOSE 5213

# Run the application
ENTRYPOINT ["dotnet", "backend.dll"]