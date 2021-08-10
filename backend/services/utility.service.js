const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const consts = require('../configs/consts');

function UtilityService() {
    this._logging = true;
}

UtilityService.prototype.enableLogging = function() {
    this._logging = true;
};

UtilityService.prototype.disableLogging = function() {
    this._logging = false;
};

UtilityService.prototype.saveRemoteFileToLocal = function(fileUrl) {
    return new Promise((resolve, reject) => {
        var fileStream;
        var filePath;
        var _http = http;
        if (fileUrl.includes('https')) {
            _http = https;
        }
        var request = _http.get(fileUrl, function(response) {
            if (!fileStream) {
                var filename = path.basename(fileUrl);
                var extension;
                if (!filename) {
                    var contentType = response.headers['content-type'];
                    extension = consts.allContentTypeAndExtMapping[contentType];
                    filename = 'remoteFile_' + ((Math.random() * 1000).toFixed()) + extension
                }
                filePath = path.join(__dirname, '..', 'temp-files', filename);
                console.log('filePath', filePath);
                fileStream = fs.createWriteStream(filePath);
            }
            response.pipe(fileStream);
            resolve(filePath);
        });
        request.on('error', function(err) {
            reject(err);
        });
        
    });
};

UtilityService.prototype.convertHHMMSS2Seconds = function(inputTimeStr) {
    var timeArr = inputTimeStr.split(':');
    var seconds = (Number(timeArr[0]) * 60 + Number(timeArr[1])) * 60 + Number(timeArr[2]);
    return seconds;
};

UtilityService.prototype.basename = function(filePath, extname) {
    let basename = path.basename(filePath);
    basename = basename.split('?')[0];
    if (extname) {
        basename = basename.replace(extname, '');
    }
    return basename;
};

UtilityService.prototype.extname = function(filePath) {
    const basename = path.extname(filePath);
    return basename.split('?')[0];
};

UtilityService.prototype.log = function() {
    if (this._logging) {
        for (var i = 0; i < arguments.length; i++) {
            console.log(arguments[i]);
        }
    }
};

module.exports = new UtilityService;


function getMapping(tableElement) {
    const contentTypeExtMapping = {};
    const extContentTypeMapping = {};
    const rows = tableElement.querySelectorAll('tbody tr');
    for (let i = 0; i < rows.length; i++) {
        const tr = rows[i];
        const extension = tr.children[0].children[0].innerText;
        const contentType = tr.children[2].children[0].innerText;
        contentTypeExtMapping[contentType] = extension;
        extContentTypeMapping[extension] = contentType;
    };
    //JSON.stringify(contentTypeExtMapping);
    return {contentTypeExtMapping, extContentTypeMapping};
}