# node-s3-extra [![Build Status](https://travis-ci.org/akofman/node-s3-extra.svg?branch=main)](https://travis-ci.org/akofman/node-s3-extra)

> Convenient extra methods for the AWS.S3 service.

## Install

    $ npm install s3-extra

## Usage

```js
const s3 = require('s3-extra')({ uploadConcurrency: 50 });

// original s3 api services are still reachable
var params = { Bucket: 'bucket', Key: 'key', Body: stream };
s3.putObject(params, (err, data) => {
  console.log(err, data);
});

// plus some extra methods

try {
  // retrieve an S3 object stream from its url
  const objStream = s3.getObjectStream('s3://my-bucket/my/object/filename');

  // upload a folder and keep the same hierarchy
  await s3.uploadFileOrFolder('my/local/folder/path/', 's3://my-bucket/path/', {
    ACL: 'public-read'
  });

  // or just upload a file
  await s3.uploadFileOrFolder(
    'my/local/folder/path/file.txt',
    's3://my-bucket/path/'
  );
} catch (err) {
  throw err;
}
```

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

#### Table of Contents

- [getObjectStream](#getobjectstream)
  - [Parameters](#parameters)
- [uploadFileOrFolder](#uploadfileorfolder)
  - [Parameters](#parameters-1)

### getObjectStream

Retrieves objects from Amazon S3.

#### Parameters

- `s3Url` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** a valid s3 url reprensenting the location of the object to get.
- `params` **[object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** the same params as the AWS [getObject](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObject-property) method are accepted. (optional, default `{}`)

Returns **[object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** a stream object.

### uploadFileOrFolder

Uploads a file or a folder to an Amazon S3 bucket.

#### Parameters

- `contentPath` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** a path to a file or a folder to upload.
- `s3Url` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** a valid s3 url representing the location to put the content.
- `params` **[object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** the same params as the AWS [upload](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property) method are accepted. (optional, default `{}`)

Returns **[object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** a promise.

## License

MIT Licensed. Copyright (c) Alexis Kofman 2019.
