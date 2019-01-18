const fs = require('fs');
const path = require('path');
const parseS3Url = require('parse-aws-s3-url');
const mime = require('mime');

const s3extra = s3 => {

    const origUpload = s3.upload;

    const getObjectStream = s3Url => {
        return s3.getObject(parseS3Url(s3Url)).createReadStream();
    };

    const upload = (contentPath, s3Url, params = {}) => {
        return new Promise(async (resolve, reject) => {
            try {
                if (fs.lstatSync(contentPath).isDirectory()) {
                    if (s3Url.slice(-1) !== '/') {
                        throw new Error('s3 url should be a folder instead of a file.');
                    }

                    fs.readdir(contentPath, async (err, files) => {
                        if (err) throw err;

                        for (const fileName of files) {
                            const filePath = path.join(contentPath, fileName);

                            if (fs.lstatSync(filePath).isDirectory()) {
                                await upload(filePath, `${s3Url}${fileName}/`, params);
                                continue;
                            }

                            await uploadFile(filePath, `${s3Url}`, params);
                        }
                    });
                } else {
                    await uploadFile(contentPath, s3Url, params);
                }
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    };

    const uploadFile = async (filePath, s3Url, params = {}) => {
        const filename = path.basename(filePath);
        const { Bucket, Key } = parseS3Url(s3Url);
        const fileKey = Key ? (Key.slice(-1) === '/' ? `${Key}${filename}` : Key) : filename;

        await s3.origUpload({
            Bucket,
            Key: fileKey,
            Body: fs.createReadStream(filePath),
            ContentType: mime.getType(filePath),
            ...params
        }).promise();

        console.log(`upload: '${filePath}' to 's3://${Bucket}/${fileKey}'`);
    };

    return Object.assign(s3, { getObjectStream, upload, origUpload });
};

module.exports = ({ AWS = require('aws-sdk'), ...s3Opts } = {}) => {
    const s3 = new AWS.S3(s3Opts);
    return s3extra(s3);
};