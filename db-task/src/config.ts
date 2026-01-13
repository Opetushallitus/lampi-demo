export function getConfig() {
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
	if (typeof maybeEnv === 'undefined') throw new Error(`Missing env variable ${name}`)

	return maybeEnv
}
