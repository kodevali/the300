# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Docker quick start

Build and run the app with Docker Compose:

```bash
docker compose up --build
```

The app will be available at http://localhost:3000.

### Persisted data

Application data is stored in `./data` and is mounted into the container at `/app/data`.

## Docker dev mode

Run the dev server with hot reload:

```bash
docker compose up --build app-dev
```

The dev server runs on http://localhost:3000.
