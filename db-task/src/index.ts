async function getManifestFile() {

}

async function main() {
  console.info('Starting to restore Koodisto CSV data to database')

  const conf = getConfig()
  const manifest = await getManifestFile()
  console.log('jooooh', {manifest, conf})
}

function getConfig() {
  return {
    db: {
      hostname: requireEnv('PG_HOST'),
      port: requireEnv('PG_PORT'),
      databaseName: requireEnv('DB_NAME'),
      username: requireEnv('POSTGRES_USER'),
      password: requireEnv('POSTGRES_PASSWORD'),
    }
  }
}

function requireEnv(name: string): string {
  const maybeEnv = process.env[name]
  if (typeof maybeEnv === 'undefined') throw new Error(`Missing env variable ${name}`)

  return maybeEnv
}

main()
  .then(() => {
    console.log('Successfully restored Koodisto CSV data to database')
    process.exit(0)
  })
  .catch(e => {
    const {db} = getConfig()
    console.error(`Failed to restore Koodisto data to database ${db.hostname}:${db.port}`, e)
    process.exit(1)
  })