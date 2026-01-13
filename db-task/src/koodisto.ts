import type { Client } from 'pg'
import type { ManifestFile } from './s3'
import { text } from 'node:stream/consumers'
import { withDatabaseTransaction } from './db'
import { getObjectBody } from './s3'

export async function restoreKoodistoDataFromS3toDB() {
	console.info('Starting to restore Koodisto CSV data to database')

	const manifest = await getManifestFile()
	const schema = await getSchemaFile(manifest.schema.key)

	await withDatabaseTransaction(async (db) => {
		await createDatabaseWithSchema(db, schema)
	})

	console.log(JSON.stringify({ manifest }))
}

async function createDatabaseWithSchema(db: Client, schema: string) {
	console.info('Creating database koodisto')

	await db.query(`DROP SCHEMA IF EXISTS koodisto;`)
	await db.query(`CREATE SCHEMA koodisto;`)
	await db.query(schema)

	console.info('Database koodisto has been created')
}

async function getManifestFile(): Promise<ManifestFile> {
	const manifestBody = await getObjectBody('oph-lampi-local', 'manifest.json')
	return JSON.parse(await text(manifestBody.Body))
}

async function getSchemaFile(Key: string): Promise<string> {
	const schema = await getObjectBody('oph-lampi-local', Key)
	return await text(schema.Body)
}
