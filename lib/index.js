const fs = require('fs');
const path = require('path');
const parseS3Url = require('parse-aws-s3-url');
const FileType = require('file-type');
const { default: PQueue } = require('p-queue');
const AWS = require('aws-sdk');

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

  const uploadFile = async (file, s3Url, params = {}) => {
    const { Bucket, Key } = parseS3Url(s3Url);
    const filename = path.basename(file);
    const fileKey =
      (Key && Key.slice(-1) === '/' ? `${Key}${filename}` : Key) || filename;
    const fileType = await FileType.fromStream(fs.createReadStream(file));

    return s3
      .upload({
        Bucket,
        Key: fileKey,
        Body: fs.createReadStream(file),
        ContentType: fileType && fileType.mime,
        ...params
      })
      .promise();
  };

  /**
   * Uploads a file or a folder to an Amazon S3 bucket.
   * @param {string} contentPath a path to a file or a folder to upload.
   * @param {string} s3Url a valid s3 url representing the location to put the content.
   * @param {object} [params={}] the same params as the AWS {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property upload} method are accepted.
   * @returns {object} a promise.
   */
  const uploadFileOrFolder = async (contentPath, s3Url, params = {}) => {
    let s3Folder = s3Url;
    let promise;

    if (fs.lstatSync(contentPath).isDirectory()) {
      if (s3Folder.slice(-1) !== '/') {
        s3Folder = `${s3Folder}/`;
      }

      const files = fs.readdirSync(contentPath);

      for (const fileName of files) {
        const filePath = path.join(contentPath, fileName);

        if (fs.lstatSync(filePath).isDirectory()) {
          await uploadFileOrFolder(filePath, `${s3Folder}${fileName}`, params);
          continue;
        }

        queue.add(() => uploadFile(filePath, s3Folder, params));
      }

      promise = queue;
    } else if (fs.lstatSync(contentPath).isFile()) {
      promise = uploadFile(contentPath, s3Folder, params);
    }

    return promise;
  };

  return Object.assign(s3, { getObjectStream, uploadFileOrFolder });
};

module.exports = ({ aws = AWS, uploadConcurrency = 100, ...s3Opts } = {}) => {
  const s3 = new aws.S3(s3Opts);
  const queue = new PQueue({ concurrency: uploadConcurrency });

  return s3extra(s3, queue);
};
