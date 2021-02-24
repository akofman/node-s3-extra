const mockS3 = {
  upload: jest.fn().mockReturnThis(),
  promise: jest.fn().mockResolvedValue({
    ETag: 'mock-etag',
    Location: 'mock-location'
  })
};

const fs = require('fs');
const { uploadFileOrFolder } = require('../lib')();

jest.mock('aws-sdk', () => {
  return { S3: jest.fn(() => mockS3) };
});

jest.mock('fs', () => {
  return {
    lstatSync: jest.fn(),
    readdirSync: jest.fn(() => ['file1.jpg', 'file2.txt']),
    createReadStream: jest.fn(() => 'Body')
  };
});

jest.mock('file-type', () => {
  return {
    fromStream: jest.fn(() => ({
      mime: 'type/test',
      ext: 'test'
    }))
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('uploadFileOrFolder tests', () => {
  it('should upload a file to an s3 url', async () => {
    fs.lstatSync.mockImplementation(() => ({
      isDirectory: () => false,
      isFile: () => true
    }));

    await uploadFileOrFolder('path/to/a/file', 's3://bucket/key.jpg');

    expect(mockS3.upload).toHaveBeenCalledTimes(1);
    expect(mockS3.upload).toHaveBeenCalledWith({
      Bucket: 'bucket',
      Key: 'key.jpg',
      Body: 'Body',
      ContentType: 'type/test'
    });
  });

  it('should upload a folder from an s3 url', async () => {
    fs.lstatSync
      .mockImplementationOnce(() => ({
        isDirectory: () => true
      }))
      .mockImplementation(() => ({
        isDirectory: () => false
      }));

    await uploadFileOrFolder('/local/folder/', 's3://bucket/folder/');

    expect(mockS3.upload).toHaveBeenCalledTimes(2);
    expect(mockS3.upload).toHaveBeenCalledWith({
      Bucket: 'bucket',
      Key: 'folder/file2.txt',
      Body: 'Body',
      ContentType: 'type/test'
    });
    expect(mockS3.upload).toHaveBeenCalledWith({
      Bucket: 'bucket',
      Key: 'folder/file1.jpg',
      Body: 'Body',
      ContentType: 'type/test'
    });
  });
});
