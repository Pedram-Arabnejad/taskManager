# Design decisions

Short notes on the choices that are not obvious from the spec. One entry per decision.

## D1 — The rewrite happens in place, on a phase branch

The first version of this repository had a different domain model (tasks owned directly by a
user) and none of the operational pieces the spec requires (tests, Docker, CI, OpenAPI).
Instead of starting a new repository, the code was rewritten on `feat/spec-compliance` so the
existing commit history and pull requests stay meaningful. Files that survived are the ones
the spec asks for anyway: the layering, the manual DI container and the domain-era error
classes.

## D2 — CommonJS instead of ESM

The spec does not mandate a module system. CommonJS was chosen because it keeps `ts-jest`,
Supertest and the Prisma CLI on their best-supported path, and it avoids the mandatory `.js`
extensions in relative imports that `module: NodeNext` imposes. `tsx` handles the dev loop, so
there is no build-speed downside.

## D3 — TypeScript is pinned to 5.9, not the 7.x line

TypeScript 7 exists, but the test toolchain (`ts-jest`) and several ESLint type-aware rules
are only validated against 5.x today. A test suite that cannot compile is worse than a
slightly older compiler, so the version is pinned deliberately.

## D4 — Jest runs as two projects

Unit tests (`tests/unit/**/*.spec.ts`) and database-backed integration tests
(`tests/integration/**/*.e2e-spec.ts`) have very different requirements: the first must stay
fast and I/O free, the second needs a real Postgres and must run serially. Splitting them into
two Jest projects keeps `pnpm test` fast and lets CI run them as separate steps.

## D5 — `/health/ready` is intentionally missing in phase 1

`GET /health` is the liveness probe and must not touch the database. The readiness probe has
to run `SELECT 1` against Postgres, so it is added together with the Prisma client in phase 3
rather than shipping a fake "ready" answer now.

## D6 — Errors are modelled as domain classes, not HTTP exceptions

`domain/errors/domain-errors.ts` defines a single base class carrying a stable `code` and an
`httpStatus` hint. The domain layer never imports Express; the presentation layer maps the
error to the documented JSON envelope. New failure modes are added by subclassing, so the
error handler keeps working unchanged.

## D7 — The request id is validated before it is trusted

`x-request-id` is echoed back when the client sends it, which makes cross-service tracing
possible, but the value is length-checked (<= 128 chars) and trimmed first: an attacker must
not be able to inject arbitrary payloads into logs through a header.
