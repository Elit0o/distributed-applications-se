# Movie Theatre Management System — Startup Guide

## Overview

The **Movie Theatre Management System** is a .NET 10 Web API backend for managing movies, screening halls, screenings, tickets, and users. It uses JWT-based authentication and exposes a RESTful API with pagination and role-based access (admin vs regular user).

---

## Prerequisites

Before running the project, ensure you have the following installed:

| Tool | Version | Download |
|------|---------|----------|
| .NET SDK | 10.0+ | https://dotnet.microsoft.com/download |
| SQL Server (or compatible) | Any recent version | https://www.microsoft.com/en-us/sql-server |
| Git | Latest | https://git-scm.com/ |
| IDE (recommended) | Visual Studio 2022+ or VS Code | https://visualstudio.microsoft.com/ |

## Step 1 — Clone the Repository

```bash
git clone https://github.com/your-org/Movie-Theatre-Management-System.git
cd Movie-Theatre-Management-System
```

---

## Step 2 — Configure and Start the Backend

### 2a. Set up appsettings.json

Create or open `appsettings.json` in the API project and add:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=MovieTheatreDB;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "TokenSettings": {
    "SecurityKey": "your-super-secret-key-min-16-chars",
    "Issuer": "MovieTheatreAPI",
    "Audience": "MovieTheatreClients",
    "ExpireTime": 60
  }
}
```

### 2b. Apply database migrations

```bash
dotnet ef database update --project MovieTheatre.Data --startup-project MovieTheatre.API
```

### 2c. Run the API

```bash
dotnet run --project MovieTheatre.API
```

The API starts at **`https://localhost:7095`** — this is the default URL the frontend expects.

---

## Step 3 — Start the Frontend

Open a second terminal, navigate to the frontend folder, and run:

```bash
cd MovieTheatre.FrontEnd
npm install
npm run dev
```

The frontend starts at **`http://localhost:5173`** and is accessible from any device on your network (the `--host` flag is set in `vite.config.js`).

> **Important:** The backend must already be running before you open the frontend, otherwise API calls will fail.

---
## Quick Start Checklist

**Backend**
- [ ] .NET 10 SDK installed
- [ ] SQL Server running
- [ ] `appsettings.json` configured (connection string + TokenSettings)
- [ ] `dotnet ef database update` completed
- [ ] API running at `https://localhost:7095`

**Frontend**
- [ ] Node.js 18+ installed
- [ ] `npm install` completed inside `MovieTheatre.FrontEnd/`
- [ ] `npm run dev` running at `http://localhost:5173`
- [ ] (Optional) `.env` file created if API is on a non-default URL

**First run**
- [ ] Register a user account via the frontend
- [ ] (Admin) Use the API or an existing admin to set `isAdmin: true` on your account
- [ ] Log in and explore the Program, Tickets, and Admin Panel tabs
