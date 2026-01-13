import type { Client } from 'pg'
import type { ManifestFile } from './s3'
import { text } from 'node:stream/consumers'
import { pipeline } from 'node:stream/promises'
import { from as copyFrom } from 'pg-copy-streams'
import { withDatabaseTransaction } from './db'
import { getObjectBody } from './s3'

export async function restoreKoodistoDataFromS3toDB() {
	console.info('Starting to restore CSV data to database schema "koodisto"')

	const manifest = await getManifestFile()
	const schema = await getSchemaFile(manifest)

	await withDatabaseTransaction(async (db) => {
		await createDatabaseWithSchema(db, schema)
		await Promise.all(manifest.tables.map((table) => importTableToDatabase(db, table.key)))
	})
}

async function createDatabaseWithSchema(db: Client, schema: string) {
	console.info('Creating schema "koodisto"')

	await db.query(`DROP SCHEMA IF EXISTS koodisto CASCADE;`)
	await db.query(`CREATE SCHEMA koodisto;`)
	await db.query(schema)

	console.info('Schema "koodisto" has been created')
}

async function importTableToDatabase(db: Client, s3Key: string) {
	const tableName = s3Key.split('.csv')[0] // strip .csv suffix from file name
	console.info(`Importing data for table "${tableName}" from S3`)

	const tableDataAsCsvStream = await getObjectBody('oph-lampi-local', s3Key)
	const copyQuery = `COPY koodisto.${tableName} FROM STDIN WITH (FORMAT csv, HEADER true)`
	const copyStream = db.query(copyFrom(copyQuery))
	await pipeline(tableDataAsCsvStream.Body, copyStream)

	console.info(`Successfully imported data for table "${tableName}"`)
}

async function getManifestFile(): Promise<ManifestFile> {
	console.info('Reading manifest from S3')
	const manifestBody = await getObjectBody('oph-lampi-local', 'manifest.json')
	return JSON.parse(await text(manifestBody.Body))
}

async function getSchemaFile(manifest: ManifestFile): Promise<string> {
	console.info(`Reading schema from S3`)
	const schemaS3Key = manifest.schema.key
	const schema = await getObjectBody('oph-lampi-local', schemaS3Key)
	return await text(schema.Body)
}
