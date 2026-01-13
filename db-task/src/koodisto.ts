import type { Client } from 'pg'
import type { ManifestFile } from './s3'
import { text } from 'node:stream/consumers'
import { pipeline } from 'node:stream/promises'
import { from as copyFrom } from 'pg-copy-streams'
import { withDatabaseTransaction } from './db'
import { getObjectBody } from './s3'

export async function restoreKoodistoDataFromS3toDB() {
	console.info('Starting to restore Koodisto CSV data to database')

	const manifest = await getManifestFile()
	const schema = await getSchemaFile(manifest.schema.key)

	await withDatabaseTransaction(async (db) => {
		await createDatabaseWithSchema(db, schema)
		await Promise.all(manifest.tables.map(async (table) => importTableToDatabase(db, table.key)))
	})

	console.log(JSON.stringify({ manifest }))
}

async function createDatabaseWithSchema(db: Client, schema: string) {
	console.info('Creating database koodisto')

	await db.query(`DROP SCHEMA IF EXISTS koodisto CASCADE;`)
	await db.query(`CREATE SCHEMA koodisto;`)
	await db.query(schema)

	console.info('Database koodisto has been created')
}

async function importTableToDatabase(db: Client, s3Key: string) {
	const tableName = s3Key.split('.csv')[0] // strip .csv suffix from
	const tableDataAsCsvStream = await getObjectBody('oph-lampi-local', s3Key)

	console.info(`Importing table ${tableName} from S3`)

	const copyQuery = `COPY koodisto.${tableName} FROM STDIN WITH (FORMAT csv, HEADER true)`
	const copyStream = db.query(copyFrom(copyQuery))

	await pipeline(tableDataAsCsvStream.Body, copyStream)

	console.info(`Successfully imported table ${tableName}`)
}

async function getManifestFile(): Promise<ManifestFile> {
	const manifestBody = await getObjectBody('oph-lampi-local', 'manifest.json')
	return JSON.parse(await text(manifestBody.Body))
}

async function getSchemaFile(s3Key: string): Promise<string> {
	const schema = await getObjectBody('oph-lampi-local', s3Key)
	return await text(schema.Body)
}
