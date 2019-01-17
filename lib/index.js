const fs = require('fs');
const path = require('path');
const parseS3Url = require('parse-aws-s3-url');

const s3extra = s3 => {

    const getObjectStream = s3Url => {
        return s3.getObject(parseS3Url(s3Url)).createReadStream();
    };

    const uploadFolder = (folderPath, s3Path) => {
        return new Promise((resolve, reject) => {
            fs.readdir(folderPath, async (err, files) => {
                if (err) reject(err);

                for (const fileName of files) {
                    const filePath = path.join(folderPath, fileName);

                    if (fs.lstatSync(filePath).isDirectory()) {
                        await uploadFolder(filePath, `${s3Path}/${fileName}`);
                        continue;
                    }

                    fs.readFile(filePath, async (err, file) => {
                        if (err) reject(err);

                        const { Bucket, Key } = parseS3Url(s3Path);
                        await s3.putObject({
                            Bucket,
                            Key: Key ? `${Key}/${fileName}` : fileName,
                            Body: file
                        }).promise();
                        console.log(`Successfully uploaded '${Key}/${fileName}'!`);
                    });
                }
                resolve();
            });
        });
    };

    return Object.assign(s3, { getObjectStream, uploadFolder });
};

module.exports = ({ AWS = require('aws-sdk'), ...s3Opts } = {}) => {
    const s3 = new AWS.S3(s3Opts);
    return s3extra(s3);
};