# Deno Deploy

This project can run on Deno Deploy using the Deno-native static SPA server in `server-deno.ts`.

## 1. Build locally

Install dependencies and create the production bundle:

```bash
npm install
npm run build
```

The build must create `dist/` before deployment.

## 2. Configure environment variables

Set these in the Deno Deploy project dashboard. Do not commit `.env` or API keys.

```text
VITE_REOWN_PROJECT_ID=your_reown_project_id
VITE_ALCHEMY_API_KEY=your_alchemy_api_key
VITE_LIDO_REFERRAL_ADDRESS=0x0000000000000000000000000000000000000000
VITE_STETH_ADDRESS=0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84
VITE_WSTETH_ADDRESS=0x7f39C581F595B53c5cb19bd0b3f8DA6c935E2Ca0
```

`VITE_*` values are compiled into the browser bundle. Only use public project IDs and client-side RPC keys. Never place private keys or admin secrets in these variables.

## 3. Deploy with the dashboard

Create a Deno Deploy project and select `server-deno.ts` as the entrypoint. Include the generated `dist/` directory and set the environment variables above.

For a GitHub-connected project, use:

```text
Entrypoint: server-deno.ts
Install command: npm install
Build command: npm run build
```

The server exposes:

```text
GET /api/health
```

and serves the compiled SPA with history fallback for client-side routes.

## 4. Deploy with deployctl

After authenticating with Deno Deploy:

```bash
deployctl deploy --allow-net --allow-read --allow-env server-deno.ts
```

Depending on the installed CLI, the command may be:

```bash
deployctl deploy --project=YOUR_PROJECT_NAME server-deno.ts
```

## Notes

- The existing `server.ts` remains available for Node/VPS deployments.
- `server-deno.ts` is the Deno Deploy entrypoint.
- The current app is a frontend plus static health endpoint; no private-key custody or privileged backend signing is used.
- Configure the Alchemy key in Deno Deploy rather than committing it.
