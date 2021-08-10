var awsConfig = require('../configs/aws.config');
var AWS = require('aws-sdk');
var path = require('path');
var fs = require('fs');
var consts = require('../configs/consts');
var utility = require('./utility.service');

function AWSService() {
    this.init();
}

AWSService.prototype.init = function() {
    this.initConfig();
    this.s3 = new AWS.S3({ httpOptions: { timeout: 100000 * 1000, connectTimeout: 100000 * 1000 }});
};

AWSService.prototype.initConfig = function() {
    AWS.config.update({
        accessKeyId: awsConfig.credentials.accessKeyId, 
        secretAccessKey: awsConfig.credentials.secretAccessKey,
        signatureVersion: 'v4',
        region: 'ap-south-1'
    });
};

AWSService.prototype._getSignedURL = function(Bucket, Key, Expires, callback) {
    try {
        this.s3.getSignedUrl('getObject', {
            Bucket: Bucket,
            Key : Key,
            Expires: Expires
        }, callback);
    } catch (error) {
        callback(error);        
    }
};


AWSService.prototype.getPublicURL = function(Bucket, Key, callback) {
    try {
       var url = 'https://' + Bucket + '.s3.amazonaws.com/' + Key;
       callback(null, url);
    } catch (error) {
        callback(error);        
    }
};

AWSService.prototype.getSignedURL = function(Bucket, Key, Expires, callback) {
    return this._getSignedURL(Bucket, Key, Expires, callback);
};

AWSService.prototype.uploadFile = function(Bucket, filePath, s3FolderPath, fileName, contentType, callback) {
    try {

        if (!fileName) {
            fileName = path.basename(filePath);
        }
       
        if (!contentType) {
            var ext = path.extname(filePath);
            contentType = consts.allContentTypeAndExtMapping[ext.toLowerCase()];
        }

        var Key = path.join(s3FolderPath, fileName);
        var fileStream = fs.createReadStream(filePath);
        fileStream.on('error', callback);

        var uploadParams = {
            Bucket: Bucket,
            Key: Key,
            Body: fileStream,
            ContentType: contentType
        };

        var request = this.s3.putObject(uploadParams, function(err, response) {
            if(err) {
                utility.log('upload send error ', err);
                return callback(err);
            }
            response.Key = uploadParams.Key;
            response.Bucket = Bucket;
            callback(null, response);
            request.abort();
        });

        request.on('httpUploadProgress', function(evt) {  
            utility.log(fileName +' Progress ', ((evt.loaded * 100) / evt.total) + '%'/* , evt.loaded + '/' + evt.total */);  
        });
    } catch (error) {
        callback(error);
    }
};


AWSService.prototype.deleteFile = function(Bucket, Key, callback) {
    try {
        var params = {
            Bucket: Bucket, 
            Key: Key
        };
        this.s3.deleteObject(params, callback);
    } catch (error) {
        callback(error);
    }
};

module.exports = new AWSService();