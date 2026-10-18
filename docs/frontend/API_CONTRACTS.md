# Frontend API Contracts

## Contract authority

The authoritative API definitions are in the Dolphin backend repository, particularly its API documentation and the corresponding Spring controllers, request/response DTOs, services, security configuration, and authorization helpers. Whale must not infer backend behavior from a frontend call alone.

## Frontend transport

- `frontend/src/lib/api/api-client.ts` is the shared HTTP client.
- `frontend/src/lib/api/api-error.ts` defines normalized API errors.
- `frontend/src/lib/auth/auth-service.ts` owns the existing login/logout calls.
- `frontend/src/lib/auth/access-context-service.ts` is the compatibility fallback for the current user's access context until the backend embeds it in login and refresh responses.
- Feature-specific API code belongs under `frontend/src/features/<feature>/api/`.
- `VITE_API_BASE_URL` configures the API base path. The Vite development server proxies `/api` to `VITE_BACKEND_TARGET` (default `http://localhost:8080`).

## Organization hierarchy endpoints verified in Dolphin

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/enterprises` | List accessible enterprises |
| GET | `/api/v1/regions/by-enterprise/{enterpriseId}` | List regions for an enterprise |
| GET | `/api/v1/clusters/by-region/{regionId}` | List clusters for a region |
| GET | `/api/v1/institutions/by-cluster/{clusterId}` | List institutions for a cluster |
| GET | `/api/v1/campuses/by-institution/{institutionId}` | List campuses for an institution |
| — | `/api/v1/me/access-context` | No longer called by the frontend; access context is embedded in login and refresh responses |

The coordinated proposed login/refresh response contract is documented in [`audit/AUTH_ACCESS_CONTEXT_MERGED_CONTRACT.md`](./audit/AUTH_ACCESS_CONTEXT_MERGED_CONTRACT.md).

These routes are subject to the controller permissions and service-level scope checks implemented by Dolphin. A successful frontend selection does not guarantee that any subsequent operation is authorized.

## Feature API contract inventory

The detailed endpoint-to-controller mapping is maintained in [`audit/BACKEND_API_CONTRACTS.md`](./audit/BACKEND_API_CONTRACTS.md). That inventory should be updated only after tracing the corresponding backend handler and, where relevant, its service and DTOs. When an endpoint's request/response or permission cannot be verified, record it as unverified rather than guessing.

## Error handling

The shared client normalizes errors in `ApiError`. UI code should preserve useful backend validation messages where safe and distinguish session expiration, forbidden access, missing resources, conflicts, network failures/timeouts, and server errors. Do not assume every endpoint uses every HTTP status code; follow the actual handler and exception mapping.

## Missing contracts / offline boundary

No new endpoint is introduced by the current frontend refactor. Durable offline write synchronization is not enabled merely because `idb` is present in dependencies. Before queuing and replaying attendance or marks mutations, Dolphin must expose a documented idempotency/duplicate-prevention strategy and a defined conflict response, or the frontend must use an already verified equivalent. Do not fabricate sync success.
