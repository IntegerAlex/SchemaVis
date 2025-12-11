# SchemaVis

![SchemaVis logo](./logo.png)

SchemaVis is an AGPL-3.0-or-later application for visualizing database schemas. It incorporates modifications derived from the chartdb project (AGPL-3.0).

Repository: <https://github.com/IntegerAlex/SchemaVis>

## License

- AGPL-3.0-or-later. See `LICENSE`.
- Copyright (C) 2025 Akshat Kotpalliwar (IntegerAlex).
- This project includes code derived from chartdb (AGPL-3.0). Attribution and details are in `NOTICE`.
- `COPYRIGHT` summarizes ownership and licensing.

## Environment

- `DATABASE_URL` (Postgres)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

## Source and Compliance

- Repository source (Corresponding Source) is available in this repo.
- Public deployments must offer the Corresponding Source to users (per AGPL).
- See `NOTICE` for upstream attribution and modified components.

## Third-Party Services

- When integrating services like Clerk/Neon, keep secrets in environment variables and respect their terms of service/licenses.

## Data persistence

- Drizzle ORM + Postgres
- `/api/sql-files` POST: save SQL for the authenticated Clerk user (also upserts the user record)
- `/api/sql-files` GET: list saved SQL entries for the authenticated user

## Contributing

- Contributions must be compatible with AGPL-3.0-or-later.
- Include appropriate license headers in new files and update `NOTICE` if you add or significantly modify components.
