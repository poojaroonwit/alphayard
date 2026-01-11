const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

async function checkCreds(accessKeyId, secretAccessKey) {
    console.log(`Testing credentials: ${accessKeyId} / ${secretAccessKey}`);
    const client = new S3Client({
        region: 'us-east-1',
        endpoint: 'http://localhost:9000',
        credentials: {
            accessKeyId,
            secretAccessKey
        },
        forcePathStyle: true
    });

    try {
        await client.send(new ListBucketsCommand({}));
        console.log(`✅ SUCCESS: Credentials ${accessKeyId} worked!`);
        return true;
    } catch (err) {
        if (err.Code === 'InvalidAccessKeyId' || err.code === 'InvalidAccessKeyId' || err.message.includes('Access Key Id')) {
            console.log(`❌ FAILED: Invalid Access Key`);
        } else if (err.Code === 'SignatureDoesNotMatch' || err.code === 'SignatureDoesNotMatch') {
            console.log(`❌ FAILED: Invalid Secret`);
        } else {
            console.log(`❌ FAILED: ${err.message}`);
        }
        return false;
    }
}

async function run() {
    const pairs = [
        ['minioadmin', 'minioadmin'],
        ['minio', 'minio123'],
        ['admin', 'password'],
        ['admin', 'admin123']
    ];

    for (const [key, secret] of pairs) {
        if (await checkCreds(key, secret)) {
            console.log('--- FOUND WORKING CREDENTIALS ---');
            console.log(`AWS_ACCESS_KEY_ID=${key}`);
            console.log(`AWS_SECRET_ACCESS_KEY=${secret}`);
            return;
        }
    }
    console.log('--- NO WORKING CREDENTIALS FOUND ---');
    console.log('Please check your MinIO configuration or reset the content volume.');
}

run();
