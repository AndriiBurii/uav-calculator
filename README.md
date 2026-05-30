# UAV Aerodynamic Calculator

A full-stack web application for aerodynamic analysis and launch system design of fixed-wing unmanned aerial vehicles (UAVs). Built for engineers and hobbyists who need fast, accurate calculations for UAV design.

![Calculator](https://i.imgur.com/placeholder-calculator.png)

> 🚧 **Work in progress** — core calculator functionality is complete.
> Authentication and i18n are partially implemented and currently being refined.

---

## Roadmap

- [ ] Export calculation results to PDF
- [ ] Interactive wing geometry visualizer based on input parameters
- [ ] Complete authentication flow
- [ ] Complete Ukrainian / English translations across all pages

---

## Features

- **Aerodynamic Calculator** — compute wing area, wing loading, thrust-to-weight ratio, center of gravity, aerodynamic center, and more based on aircraft geometry
- **Catapult Designer** — design and simulate pneumatic launch systems with full dynamics: piston force, carriage velocity, acceleration, and launch time
- **Configuration Management** — save and load aircraft and catapult configurations
- **Authentication** — JWT-based user registration and login _(in progress)_
- **Internationalization** — EN/UA support _(in progress)_
- **Dockerized** — one command to spin up the entire stack

---

## Tech Stack

| Layer            | Technology                               |
| ---------------- | ---------------------------------------- |
| Frontend         | React 18, TypeScript, Vite, Tailwind CSS |
| State Management | Zustand                                  |
| i18n             | react-i18next                            |
| Backend          | Go, Gin                                  |
| Database         | PostgreSQL + GORM                        |
| Cache / Sessions | Redis                                    |
| Auth             | JWT                                      |
| Infrastructure   | Docker, Docker Compose                   |

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/AndriiBurii/uav-calculator.git
   cd uav-calculator
   ```

2. Copy the environment file and fill in your values:

   ```bash
   cp .env.example .env
   ```

3. Start the application:

   ```bash
   docker-compose up --build
   ```

4. Open your browser at `http://localhost:5173`

---

## Environment Variables

| Variable      | Description                       |
| ------------- | --------------------------------- |
| `DB_HOST`     | PostgreSQL host                   |
| `DB_PORT`     | PostgreSQL port                   |
| `DB_USER`     | Database user                     |
| `DB_PASSWORD` | Database password                 |
| `DB_NAME`     | Database name                     |
| `REDIS_URL`   | Redis connection URL              |
| `JWT_SECRET`  | Secret key for signing JWT tokens |

---

## Project Structure

```
uav-calculator/
├── backend/
│   ├── cmd/server/         # Entry point
│   ├── internal/
│   │   ├── config/         # App configuration
│   │   ├── database/       # PostgreSQL & Redis setup
│   │   ├── handlers/       # HTTP handlers
│   │   ├── middleware/     # Auth & CORS middleware
│   │   ├── models/         # GORM models
│   │   └── services/       # Business logic
│   └── migrations/         # SQL migration files
├── frontend/
│   └── src/
│       ├── api/            # API client & endpoints
│       ├── components/     # UI components
│       ├── hooks/          # Custom React hooks
│       ├── i18n/           # Translations (EN / UA)
│       ├── pages/          # Page components
│       ├── store/          # Zustand stores
│       └── utils/          # Calculation logic
├── docker-compose.yml
└── .env.example
```

---

## License

MIT
