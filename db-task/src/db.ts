import { Client } from 'pg'
import { getConfig } from './config'

function getDatabaseClient() {
	const { db } = getConfig()
	return new Client(db)
}

export async function withDatabaseTransaction(functionWithDb: (db: Client) => Promise<void>) {
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
