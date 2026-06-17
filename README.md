# Farm Health

A full-stack animal health monitoring application. Track farms, animals, and health records — with a dedicated view for animals that are currently sick.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | ASP.NET Core 10 Web API (controller-based) |
| Database | Entity Framework Core + SQLite |
| Frontend | Angular 21 (standalone components, signals) |

---

## Features

### Farms
- Create, edit, and list farms with a name and optional location.

### Animals
- Create, edit, and delete animals assigned to a farm.
- Animal list is grouped by farm so you can see all animals on each farm at a glance.

### Health Records
- Log health records for each animal with a status (Healthy / Sick / Recovering) and optional notes.
- Records are displayed on the animal detail page in chronological order with colour-coded status badges.

### Sick Animals
- Dedicated view accessible from the nav bar that shows any animal whose **most recent** health record is "Sick", grouped by farm.
- Shows an all-clear screen when no animals are currently sick.

---

## Running Locally

**Requirements:** .NET 10 SDK, Node.js, Angular CLI (`npm install -g @angular/cli`)

```bash
# Terminal 1 — API
cd FarmHealth.Api
dotnet run
# Runs on http://localhost:5080
# Swagger UI: http://localhost:5080/swagger

# Terminal 2 — Frontend
cd farm-health-web
ng serve
# Runs on http://localhost:4200
```

The Angular dev server proxies `/api` requests to the .NET API automatically — no CORS configuration needed.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/farms` | List all farms |
| POST | `/api/farms` | Create a farm |
| PUT | `/api/farms/{id}` | Update a farm |
| DELETE | `/api/farms/{id}` | Delete a farm |
| GET | `/api/animals` | List all animals |
| POST | `/api/animals` | Create an animal |
| GET | `/api/animals/{id}` | Get animal detail |
| PUT | `/api/animals/{id}` | Update an animal |
| DELETE | `/api/animals/{id}` | Delete an animal |
| GET | `/api/animals/{id}/healthrecords` | List health records for an animal |
| POST | `/api/animals/{id}/healthrecords` | Add a health record |
| PUT | `/api/animals/{id}/healthrecords/{recordId}` | Update a health record |
| DELETE | `/api/animals/{id}/healthrecords/{recordId}` | Delete a health record |
