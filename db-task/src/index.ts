import { getConfig } from './config'
import { restoreKoodistoDataFromS3toDB } from './koodisto'

async function main(): Promise<void> {
	await restoreKoodistoDataFromS3toDB()
}

main()
	.then(() => {
		console.log('Successfully restored Koodisto CSV data to database')
		process.exit(0)
	})
	.catch((e) => {
		const { db } = getConfig()
		console.error(`Failed to restore Koodisto data to database ${db.host}:${db.port}`, e)
		process.exit(1)
	})
