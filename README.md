# node-s3-extra [![Build Status](https://travis-ci.org/akofman/node-s3-extra.svg?branch=master)](https://travis-ci.org/akofman/node-s3-extra)

> Convenient extra methods for the AWS.S3 service.


## Install

```
$ npm install node-s3-extra
```

## Usage

```js
const AWS = require('aws-sdk');
const s3 = require('s3-extra')({ AWS });

//retrieve an S3 object stream from its url.
const objStream = s3.getObjectStream('s3://my-bucket/my/object/filename');

//upload a folder and keep the same hierarchy.
try {
    await s3.uploadFolder('my/local/folder/path/', 's3://my-bucket/path/', { ACL: 'public-read' });
} catch (err) {
    throw err;
}
```

## License

MIT Licensed. Copyright (c) Alexis Kofman 2019.