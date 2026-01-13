import { getConfig } from './config'
import { restoreKoodistoDataFromS3toDB } from './koodisto'

async function main(): Promise<void> {
	console.info('Starting database import task')
	await restoreKoodistoDataFromS3toDB()
}

main()
	.then(() => {
		console.log('Successfully finished database import task')
		process.exit(0)
	})
	.catch((e) => {
		const { db } = getConfig()
		console.error(`Failed to execute database import task for database ${db.host}:${db.port}`, e)
		process.exit(1)
	})
