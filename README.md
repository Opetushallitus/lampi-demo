# OPH Koodisto Data Import Demo

A demonstration project showing how to efficiently restore OPH (Opetushallitus / Finnish National Agency for Education) Koodisto data from CSV files into a PostgreSQL database.

## Overview

This repository demonstrates a production-ready approach for importing large datasets (database schema + CSV data) from S3-compatible storage into PostgreSQL. The implementation uses streaming to handle large CSV files efficiently without loading them entirely into memory.

### What is Koodisto?

Koodisto is the Finnish National Agency for Education's code registry system that maintains various educational codes and classifications. The data consists of:

- **koodi**: Code entries with metadata (names, descriptions in Finnish/Swedish/English, validity periods)
- **relaatio**: Hierarchical relationships between codes

The sample dataset in this demo contains:
- ~66 MB of code data (`koodi.csv`)
- ~41 MB of relationship data (`relaatio.csv`)

## Architecture

The project consists of three main components running in Docker:

1. **PostgreSQL Database** (postgres:18.1)
   - Target database for the imported data
   - Runs with health checks to ensure readiness

2. **LocalStack S3** (localstack:4.12)
   - Local S3-compatible storage
   - Pre-populated with CSV files and schema at startup
   - Simulates production S3 environment

3. **DB Task** (Node.js application)
   - TypeScript application that performs the data import
   - Streams data directly from S3 to PostgreSQL
   - Uses PostgreSQL's `COPY` command for optimal performance

## How It Works

### Data Flow

```
S3 Bucket (LocalStack)          Node.js Application              PostgreSQL
┌─────────────────┐             ┌──────────────────┐            ┌──────────┐
│ manifest.json   │             │ Read manifest    │            │          │
│ koodisto.schema │───READ────▶ │ Create schema    │            │ Database │
│ koodi.csv       │             │ Stream CSV data  │            │          │
│ relaatio.csv    │             │                  │───COPY────▶│          │
└─────────────────┘             └──────────────────┘            └──────────┘

```

### Import Process

1. **Read Manifest**: Fetch `manifest.json` from S3 to determine which files to import
2. **Create Schema**:
   - Drop existing `koodisto` schema if it exists
   - Create fresh `koodisto` schema
   - Execute schema DDL to create tables with constraints
3. **Import Data**: For each table in the manifest:
   - Stream CSV data from S3
   - Pipe directly to PostgreSQL using `COPY FROM STDIN`
   - Process tables in parallel for faster import
4. **Commit**: All operations run in a transaction for data consistency

### Key Technical Features

- **Streaming**: CSV data flows directly from S3 to PostgreSQL without being loaded into memory
- **PostgreSQL COPY**: Uses the most efficient bulk loading method available in PostgreSQL
- **Transactional**: All changes are wrapped in a transaction with automatic rollback on failure
- **Type-Safe**: Written in TypeScript with strict type checking
- **Parallel Processing**: Multiple CSV files can be imported concurrently
- **Error Handling**: Comprehensive error handling with automatic transaction rollback

## Project Structure

```
.
├── docker-compose.yml              # Multi-container setup
├── Dockerfile                      # Node.js application container
├── start-local-env.sh              # Helper: Start local environment
├── psql-to-local-db.sh             # Helper: Connect to database
├── db-task/                        # TypeScript application
│   ├── src/
│   │   ├── index.ts               # Entry point
│   │   ├── koodisto.ts            # Main import logic
│   │   ├── db.ts                  # Database transaction management
│   │   ├── s3.ts                  # S3 client and streaming
│   │   └── config.ts              # Configuration management
│   ├── package.json
│   ├── tsconfig.json
│   └── entrypoint.sh
└── localstack/
    └── init/ready.d/              # LocalStack initialization
        ├── create-local-lampi-s3-bucket.sh
        └── data/
            ├── manifest.json       # Import manifest
            ├── koodisto.schema     # PostgreSQL schema DDL
            ├── koodi.csv          # Code data
            └── relaatio.csv       # Relationship data
```

## Prerequisites

- Docker
- Docker Compose

## Running the Demo

### Quick Start

1. **Start the local environment** (PostgreSQL + S3):
   ```bash
   ./start-local-env.sh
   ```

   This starts the database, LocalStack S3 services and runs the import task.


2. **Connect to the database** to verify the import:
   ```bash
   ./psql-to-local-db.sh
   ```

   Then run queries to verify the data:
   ```sql
   SELECT count(*) FROM koodisto.koodi;
   SELECT count(*) FROM koodisto.relaatio;
   \dt koodisto.*
   \q
   ```

3. **Stopping** 
    ```bash
      Press `Ctrl+C` to stop when done.
    ```

## Helper Scripts

The repository includes convenience scripts to simplify common operations:

| Script                | Purpose                               | Usage                             |
|-----------------------|---------------------------------------|-----------------------------------|
| `start-local-env.sh`  | Starts PostgreSQL and S3 services     | Run first to start infrastructure |
| `psql-to-local-db.sh` | Opens psql connection to the database | Interactive database access       |
| `test/run-tests.sh`   | Test the service                      | Github Actions CI pipeline        |

## Technical Implementation Details

### Database Connection

The application connects to PostgreSQL using the `pg` library with configuration from environment variables:

```typescript
PG_HOST: "db"
PG_PORT: "5432"
DB_NAME: "lampi"
POSTGRES_USER: "pgadmin"
POSTGRES_PASSWORD: "pgpassword"
```

### S3 Integration

Uses AWS SDK v3 (`@aws-sdk/client-s3`) configured for LocalStack:

```typescript
endpoint: 'http://s3:4566'
region: 'us-east-1'
forcePathStyle: true  // Required for LocalStack
```

### Streaming Pipeline

The import uses Node.js streams with `pg-copy-streams`:

```typescript
const copyQuery = `COPY koodisto.${tableName} FROM STDIN WITH (FORMAT csv, HEADER true)`
const copyStream = db.query(copyFrom(copyQuery))
await pipeline(s3Stream.Body, copyStream)
```

This approach:
- Minimizes memory usage regardless of file size
- Provides backpressure handling automatically
- Offers excellent performance for large datasets

### Transaction Management

All database operations run within a transaction:

```typescript
BEGIN;
  DROP SCHEMA IF EXISTS koodisto CASCADE;
  CREATE SCHEMA koodisto;
  [Create tables and constraints]
  [Import CSV data]
COMMIT;  // or ROLLBACK on error
```

## Dependencies

### Runtime
- `pg`: PostgreSQL client
- `pg-copy-streams`: Streaming COPY support
- `@aws-sdk/client-s3`: S3 client
- `tsx`: TypeScript execution

### Development
- `typescript`: Type checking
- `@biomejs/biome`: Code formatting and linting
- Type definitions for Node.js, pg, and AWS SDK

## Configuration

The application is configured through environment variables (see `docker-compose.yml`):

| Variable | Description | Default |
|----------|-------------|---------|
| `PG_HOST` | PostgreSQL hostname | `db` |
| `PG_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `lampi` |
| `POSTGRES_USER` | Database user | `pgadmin` |
| `POSTGRES_PASSWORD` | Database password | `pgpassword` |
| `S3_ENDPOINT` | S3 endpoint URL | `http://s3:4566` |

## Performance Characteristics

For the included sample data (~107 MB total):
- Import time: Typically < 5 seconds (depends on hardware)
- Memory usage: Minimal (~50 MB), constant regardless of file size
- Network: Streams data efficiently without buffering entire files

## Production Considerations

To adapt this for production use:

1. **S3 Configuration**: Update S3 endpoint to point to AWS S3 or your S3-compatible storage
2. **Credentials**: Use AWS IAM roles or proper credential management instead of hardcoded values
3. **Database**: Update database connection parameters for your production PostgreSQL instance
4. **Error Handling**: Add retry logic and alerting for production reliability
5. **Monitoring**: Add metrics collection and logging integration
6. **Validation**: Add data validation and checksums to verify import integrity

## License

EUPL