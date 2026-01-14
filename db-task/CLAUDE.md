# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript application that imports OPH (Opetushallitus) Koodisto data from S3-compatible storage into PostgreSQL. It streams CSV data directly to the database using PostgreSQL's COPY command for efficient bulk loading.

## Common Commands

### Development
```bash
# Install dependencies (from db-task directory)
npm ci

# Lint and format check
npm run biome:ci

# Fix lint/format issues
npm run biome:fix

# Type check
npx tsc --noEmit
```

### Running Locally
```bash
# Start PostgreSQL + LocalStack S3 and run the import task
./start-local-env.sh

# Or using docker-compose directly
docker-compose up --build

# Connect to local database
./psql-to-local-db.sh
```

### Running the Application
```bash
# Run with tsx (requires env vars set)
npx tsx src/index.ts
```

## Architecture

```
src/
├── index.ts      # Entry point, orchestrates the import task
├── config.ts     # Environment variable configuration
├── db.ts         # Database transaction management wrapper
├── koodisto.ts   # Main import logic: schema creation + CSV streaming
└── s3.ts         # S3 client and object retrieval
```

**Data Flow:**
1. `index.ts` calls `restoreKoodistoDataFromS3toDB()`
2. Reads `manifest.json` from S3 to get file list
3. Fetches schema DDL and creates tables in a transaction
4. Streams each CSV directly from S3 into PostgreSQL via `pg-copy-streams`

## Code Style

- Uses Biome for linting and formatting
- Tab indentation, single quotes, no semicolons
- Line width: 100 characters
- TypeScript with strictest settings (`@tsconfig/strictest`)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PG_HOST` | PostgreSQL hostname |
| `PG_PORT` | PostgreSQL port |
| `DB_NAME` | Database name |
| `POSTGRES_USER` | Database user |
| `POSTGRES_PASSWORD` | Database password |
| `S3_ENDPOINT` | S3 endpoint URL |
