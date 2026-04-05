These files are **deprecated**. The supported stack is **native Node.js** + **Crawlee** + **Playwright** from the repository root:

`npm install` → `npm run setup` (Playwright Chromium) → `npm start`

Optional container build from **repository root** (paths in `docker-compose.yml` are relative to this folder):

```bash
docker compose -f .deprecated/docker/docker-compose.yml build
docker compose -f .deprecated/docker/docker-compose.yml up -d
```
