import assert from 'node:assert'
import { after, before, describe, it } from 'node:test'
import { Client } from 'pg'
import { getConfig } from '../src/config'

function getDatabaseClient() {
	if (process.env.ENV === 'local-docker') {
		const { db } = getConfig()
		return new Client(db)
	}

	return new Client({
		host: '127.0.0.1',
		port: 5432,
		database: 'lampi',
		user: 'pgadmin',
		password: 'pgpassword',
	})
}
describe('Koodisto import task', () => {
	let client: Client

	before(async () => {
		client = getDatabaseClient()
		await client.connect()
	})

	after(async () => {
		await client?.end()
	})

	it('should mark task as completed', async (context) => {
		async function koodistoImportTaskIsCompleted(): Promise<boolean> {
			const query = `SELECT exists(SELECT *
                                   FROM lampi.public.task_status
                                   WHERE task_name = 'koodisto'
                                     AND status = 'completed')
                                as completed`

			const response = await client.query<{ completed: boolean }>(query)
			return Boolean(response.rows[0]?.completed)
		}

		assert.equal(
			await context.waitFor(koodistoImportTaskIsCompleted),
			true,
			'"koodisto" import task is completed',
		)
	})

	it('should create entries in koodisto.koodi table', async () => {
		const query = `SELECT count(*) FROM koodisto.koodi`
		const response = await client.query<{ count: number }>(query)
		const count = response.rows[0]?.count ?? 0

		assert.ok(count > 0, `Expected koodisto.koodi to have entries, but got ${count}`)
	})

	it('should contain the last koodisto.koodi entry', async () => {
		const query = `SELECT * FROM koodisto.koodi WHERE koodiarvo = '107696' AND koodistouri = 'tutkinnonosat'`
		const response = await client.query(query)
		const entry = response.rows[0]

		assert.equal(entry.tila, 'LUONNOS')
		assert.equal(entry.koodinimi_fi, 'Ilmastoinnin jäähdytyslaitteiden asennus ja huolto')
	})

	it('should create entries in koodisto.relaatio table', async () => {
		const query = `SELECT count(*) FROM koodisto.relaatio`
		const response = await client.query<{ count: number }>(query)
		const count = response.rows[0]?.count ?? 0

		assert.ok(count > 0, `Expected koodisto.relaatio to have entries, but got ${count}`)
	})

	it('should contain the last koodisto.relaatio entry', async () => {
		const query = `SELECT * FROM koodisto.relaatio WHERE alakoodiuri = 'ammattitaitovaatimukset_29243'`
		const response = await client.query(query)
		const entry = response.rows[0]

		assert.equal(entry.ylakoodiuri, 'tutkinnonosat_108416')
		assert.equal(entry.relaatiotyyppi, 'SISALTYY')
	})
})
