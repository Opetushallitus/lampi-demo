import type { NodeJsClient } from '@smithy/types'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'

const AWS_REGION = 'us-east-1'
const s3 = new S3Client({
	endpoint: 'http://s3:4566',
	disableHostPrefix: true,
	forcePathStyle: true,
	region: AWS_REGION,
	credentials: {
		accessKeyId: 'not-used-by-localstack',
		secretAccessKey: 'not-used-by-localstack',
	},
}) as NodeJsClient<S3Client>

type S3File = {
	key: string
}

export type ManifestFile = {
	tables: S3File[]
	schema: S3File
}

export async function getObjectBody(Bucket: string, Key: string, VersionId?: string) {
	const commandParams = {
		Bucket,
		Key,
		...(VersionId ? { VersionId } : undefined),
	}

	console.debug('Getting object body with params', commandParams)
	const response = await s3.send(new GetObjectCommand(commandParams))

	const { Body } = response

	if (typeof Body === 'undefined') {
		throw new Error(`Failed to read object ${Key} from bucket ${Bucket}`)
	}

	return {
		...response,
		Body,
	}
}
