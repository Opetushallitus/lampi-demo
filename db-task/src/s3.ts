import type { NodeJsClient } from '@smithy/types'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getConfig } from './config'

const AWS_REGION = 'us-east-1'

let s3: NodeJsClient<S3Client>

type S3File = {
	key: string
}

export type ManifestFile = {
	tables: S3File[]
	schema: S3File
}

function getS3Client() {
	if (!s3) {
		s3 = new S3Client({
			endpoint: getConfig().s3.endpoint,
			disableHostPrefix: true,
			forcePathStyle: true,
			region: AWS_REGION,
			credentials: {
				accessKeyId: 'not-used-by-localstack',
				secretAccessKey: 'not-used-by-localstack',
			},
		}) as NodeJsClient<S3Client>
	}

	return s3
}

export async function getObjectBody(Bucket: string, Key: string, VersionId?: string) {
	const s3Client = getS3Client()
	const commandParams = { Bucket, Key, VersionId }

	console.debug('Getting object body with params', commandParams)
	const response = await s3Client.send(new GetObjectCommand(commandParams))
	const { Body } = response

	if (typeof Body === 'undefined') {
		throw new Error(`Failed to read object ${Key} from bucket ${Bucket}`)
	}

	return {
		...response,
		Body,
	}
}
