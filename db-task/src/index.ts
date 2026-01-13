import { text } from 'node:stream/consumers'
import { getObjectBody } from './s3'

async function main() {
	console.info('Starting to restore Koodisto CSV data to database')

	const conf = getConfig()
	const manifest = await getManifestFile()

	console.log(JSON.stringify({ manifest, conf }))
}

type S3File = {
	key: string
	s3Version: string
}

export type ManifestFile = {
	tables: S3File[]
	schema: S3File
}

async function getManifestFile(): Promise<ManifestFile> {
	const manifestBody = await getObjectBody('oph-lampi-local', 'manifest.json')

	const manifest = await text(manifestBody.Body)
	return JSON.parse(manifest)
}

function getConfig() {
	return {
		db: {
			hostname: requireEnv('PG_HOST'),
			port: requireEnv('PG_PORT'),
			databaseName: requireEnv('DB_NAME'),
			username: requireEnv('POSTGRES_USER'),
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
			`Failed to restore Koodisto data to database ${db.hostname}:${db.port}`,
			e,
		)
		process.exit(1)
	})
