const fs = require('fs');
const path = require('path');
const parseS3Url = require('parse-aws-s3-url');
const FileType = require('file-type');
const { default: PQueue } = require('p-queue');

const s3extra = (s3, queue) => {

    /**
     * Retrieves objects from Amazon S3.
     * @param {string} s3Url a valid s3 url reprensenting the location of the object to get.
     * @param {object} [params={}] the same params as the AWS {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObject-property getObject} method are accepted.
     * @returns {object} a stream object.
     */
    const getObjectStream = (s3Url, params = {}) => {
        return s3.getObject({ ...parseS3Url(s3Url), ...params }).createReadStream();
    };

    /**
     * Uploads a file or a folder to Amazon S3.
     * @param {string} content a path to a file or a folder to upload.
     * @param {string} s3Url a valid s3 url representing the location to put the content. In case of a folder, this url must be ended by '/'.
     * @param {object} [params={}] the same params as the AWS {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property upload} method are accepted.
     * @returns {object} a promise.
     */
    const uploadFileOrFolder = (content, s3Url, params = {}) => {
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
                                await uploadFileOrFolder(filePath, `${s3Url}${fileName}/`, params);
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

                    await s3.upload({
                        Bucket,
                        Key,
                        Body: content,
                        ContentType: await FileType.fromBuffer(content),
                        ...params
                    }).promise();
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
        const body = fs.createReadStream(file);
        const contentType = await FileType.fromBuffer(body);

        queue.add(() => s3.upload({
            Bucket,
            Key: fileKey,
            Body: body,
            ContentType: contentType,
            ...params
        }).promise());
    };

    return Object.assign(s3, { getObjectStream, uploadFileOrFolder });
};

module.exports = ({ AWS = require('aws-sdk'), uploadConcurrency = 100, ...s3Opts } = {}) => {
    const s3 = new AWS.S3(s3Opts);
    const queue = new PQueue({ concurrency: uploadConcurrency });

    return s3extra(s3, queue);
};