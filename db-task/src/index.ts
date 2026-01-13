import { text } from 'node:stream/consumers'
import { Client } from 'pg'
import { getObjectBody } from './s3'

async function main() {
	console.info('Starting to restore Koodisto CSV data to database')

	const manifest = await getManifestFile()
	const schema = await getSchemaFile(manifest.schema.key)

	await withDatabaseTransaction(async (db) => {
		await createDatabaseWithSchema(db, schema)
	})

	console.log(JSON.stringify({ manifest }))
}

function getDatabaseClient() {
	const { db } = getConfig()
	return new Client(db)
}

async function withDatabaseTransaction(
	functionWithDb: (db: Client) => Promise<void>,
) {
	const db = getDatabaseClient()
	try {
		await db.connect()
		await db.query('BEGIN;')
		await functionWithDb(db)
		await db.query('COMMIT;')
	} catch (e) {
		console.error(`DB transaction failure`, e)
		await db.query('ROLLBACK;')
		throw e
	} finally {
		await db.end()
	}
}

async function createDatabaseWithSchema(db: Client, schema: string) {
	console.info('Creating database koodisto')

	await db.query(`DROP SCHEMA IF EXISTS koodisto;`)
	await db.query(`CREATE SCHEMA koodisto;`)
	await db.query(schema)

	console.info('Database koodisto has been created')
}

type S3File = {
	key: string
}

export type ManifestFile = {
	tables: S3File[]
	schema: S3File
}

async function getManifestFile(): Promise<ManifestFile> {
	const manifestBody = await getObjectBody('oph-lampi-local', 'manifest.json')
	return JSON.parse(await text(manifestBody.Body))
}

async function getSchemaFile(Key: string): Promise<string> {
	const schema = await getObjectBody('oph-lampi-local', Key)
	return await text(schema.Body)
}

function getConfig() {
	return {
		db: {
			host: requireEnv('PG_HOST'),
			port: parseInt(requireEnv('PG_PORT'), 10),
			database: requireEnv('DB_NAME'),
			user: requireEnv('POSTGRES_USER'),
			password: requireEnv('POSTGRES_PASSWORD'),
		},
	}
}

function requireEnv(name: string): string {
	const maybeEnv = process.env[name]
	if (typeof maybeEnv === 'undefined')
		throw new Error(`Missing env variable ${name}`)

	return maybeEnv
}

main()
	.then(() => {
		console.log('Successfully restored Koodisto CSV data to database')
		process.exit(0)
	})
	.catch((e) => {
		const { db } = getConfig()
		console.error(
			`Failed to restore Koodisto data to database ${db.host}:${db.port}`,
			e,
		)
		process.exit(1)
	})
