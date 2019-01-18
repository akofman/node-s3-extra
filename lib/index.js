const fs = require('fs');
const path = require('path');
const parseS3Url = require('parse-aws-s3-url');
const mime = require('mime');

const s3extra = s3 => {

    const origUpload = s3.upload;

    const getObjectStream = s3Url => {
        return s3.getObject(parseS3Url(s3Url)).createReadStream();
    };

    const upload = (content, s3Url, params = {}) => {
        return new Promise(async (resolve, reject) => {
            try {
                if (typeof content === 'string') {
                    if (fs.lstatSync(content).isDirectory()) {
                        if (s3Url.slice(-1) !== '/') {
                            throw new Error('s3 url should be a folder instead of a file.');
                        }

                        const files = fs.readdirSync(content);

                        for (const fileName of files) {
                            const filePath = path.join(content, fileName);

                            if (fs.lstatSync(filePath).isDirectory()) {
                                await upload(filePath, `${s3Url}${fileName}/`, params);
                                continue;
                            }

                            await uploadFile(filePath, `${s3Url}`, params);
                        }

                    } else if (fs.lstatSync(content).isFile()) {
                        await uploadFile(content, s3Url, params);
                    }
                } else {
                    // if it's a stream, an arbitrarily sized buffer or a blob
                    const { Bucket, Key } = parseS3Url(s3Url);

                    if (!Key || Key.slice(-1) === '/') {
                        throw new Error('s3 url should be a file instead of a folder path');
                    }

                    await s3.origUpload({
                        Bucket,
                        Key,
                        Body: content,
                        ...params
                    }).promise();

                    console.log(`upload: content to '${s3Url}'`);
                }

                resolve();
            } catch (err) {
                reject(err);
            }
        });
    };

    const uploadFile = async (file, s3Url, params = {}) => {
        const { Bucket, Key } = parseS3Url(s3Url);
        const filename = path.basename(file);
        const fileKey = Key ? (Key.slice(-1) === '/' ? `${Key}${filename}` : Key) : filename;

        await s3.origUpload({
            Bucket,
            Key: fileKey,
            Body: fs.createReadStream(file),
            ContentType: mime.getType(file),
            ...params
        }).promise();

        console.log(`upload: '${file}' to 's3://${Bucket}/${fileKey}'`);
    };

    return Object.assign(s3, { getObjectStream, upload, origUpload });
};

module.exports = ({ AWS = require('aws-sdk'), ...s3Opts } = {}) => {
    const s3 = new AWS.S3(s3Opts);
    return s3extra(s3);
};