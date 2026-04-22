# YouTube-Studio-Pro

Manual music distribution service for independent artists.

## Features

- Upload audio and artwork with local file storage.
- Track each release and distribute manually to YouTube, SoundCloud, Audiomack, Bandcamp, Spotify, and Apple Music.
- Update per-platform status (`pending`, `uploaded`, `failed`) while you manually publish content.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## API

- `GET /api/releases` — list all releases.
- `POST /api/releases` — create release with multipart form data (`title`, `artist`, `description`, `releaseDate`, `platforms`, `audio`, `artwork`).
- `PATCH /api/releases/:id/platform-status` — update distribution status for one platform.
