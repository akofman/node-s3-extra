# node-s3-extra [![Build Status](https://travis-ci.org/akofman/node-s3-extra.svg?branch=master)](https://travis-ci.org/akofman/node-s3-extra)

> Convenient extra methods for the AWS.S3 service.


## Install

```
$ npm install node-s3-extra
```

## Usage

You don't need to create the original s3 object anymore, this one is included into s3-extra.

Some methods can override the name of the original ones like the `upload` method, but if needed, you can retrieve them by adding the `orig` prefix.
So in order to use the original `upload` method, simply use `origUpload` instead.

```js
const AWS = require('aws-sdk');
const s3 = require('s3-extra')({ AWS });

//use it as usual when you were using the original s3 object.
var params = {Bucket: 'bucket', Key: 'key', Body: stream};
s3.putObject(params, (err, data) => {
  console.log(err, data);
});

//and enjoy the extra methods:

try {
    //retrieve an S3 object stream from its url.
    const objStream = s3.getObjectStream('s3://my-bucket/my/object/filename');

    //upload a folder and keep the same hierarchy.
    await s3.upload('my/local/folder/path/', 's3://my-bucket/path/', { ACL: 'public-read' });

    //or simply upload a file
    await s3.upload('my/local/folder/path/file.txt', 's3://my-bucket/path/');
} catch (err) {
    throw err;
}
```

## License

MIT Licensed. Copyright (c) Alexis Kofman 2019.