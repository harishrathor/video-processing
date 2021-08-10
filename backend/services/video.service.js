var awsConfig = require('../configs/aws.config');
var AWSService = require('./aws.service');
var path = require('path');
var fs = require('fs');
var child_process = require('child_process');
var utility = require('./utility.service');
var awsConfig = require('../configs/aws.config');

function VideoService() {
    this.filesToBeDeleted = [];
    this.resulution = null;
}

VideoService.prototype.getResolutionStr = function(resolution) {
    if (!resolution) {
        resolution = this.resulution;
    }
    var resolutionStr = '';
    if (resolution && resolution.width && resolution.height) {
        resolutionStr = resolution.height + 'x' + resolution.width;
    }
    return resolutionStr;
};

VideoService.prototype._createFileForFrame = function(frameData) {
        var filePath = path.join(__dirname, '..', 'temp-files', utility.basename(frameData.sourceFilePath));
        var folderLocation = path.dirname(filePath);
        var ext = utility.extname(filePath);
        var basename = utility.basename(filePath, ext);
        var frameNumber = frameData.number;
        var resolutionStr = this.getResolutionStr();
        var frameFileName = basename + '_s' + frameNumber + '_' + resolutionStr + '_' + ((Math.random() * 10000000).toFixed()) + ext;
        filePath = path.join(folderLocation, frameFileName);
        this.filesToBeDeleted.push(filePath);
        frameData.filePath = filePath;
        return filePath;
};

VideoService.prototype._makeFrameData = function(number, index, duration, offsetTime, sourceFilePath, filePath) {
    return {
        number: number,
        index: index,
        duration: duration ,
        offsetTime: offsetTime,
        sourceFilePath: sourceFilePath,
        filePath: filePath
    };
}; 

VideoService.prototype._calculateFramesByInterval = function(videoDuration, intervalDuration, sourceFilePath) {
    var fullFramesCount = parseInt(videoDuration / intervalDuration);
    var frames = [];
    var i = 1;
    for (; i <= fullFramesCount; i++) {
        var frameData = this._makeFrameData(i, i - 1, intervalDuration , (i == 1 ? 0 : ((i - 1) * intervalDuration)), sourceFilePath, '');
        this._createFileForFrame(frameData);
        frames.push(frameData);
    }
    if ((videoDuration % intervalDuration)) {
        var frameData = this._makeFrameData(i, i - 1, (videoDuration % intervalDuration).toFixed(2) , (i == 1 ? 0 : ((i - 1) * intervalDuration)), sourceFilePath, '');
        this._createFileForFrame(frameData);
        frames.push(frameData);
    }
    return frames;
}; 

VideoService.prototype._runCommand = function (command, args) {
    return new Promise(function(resolve, reject) {
        command += ' ' + args.join(' ');
        child_process.exec(command, function(err, stdout, stderr) {
            if (err) {
                reject(err);
                return;
            }
            resolve(stdout);
        });
    });
};

VideoService.prototype._uploadFrameFileAndGetURL = function(frameData, Bucket, s3Folder) {
    return new Promise(function(resolve, reject) {
        var getURLAndResolve = function(uploadData) {
            try {
                AWSService.getPublicURL(Bucket, uploadData.Key, function(error, url) {
                    if (error) {
                        utility.log('URL err for ' + frameData.filePath, err);
                        reject({err: error, type: 'OTHER'});
                    } else {
                        utility.log('Received url for frame number ', frameData.number);
                        resolve(url);
                    }
                });
               
            } catch (error) {
                reject({err: error, type: 'OTHER'});
            }
        };

        utility.log('Initiating upload for frame number ', frameData.number);

        AWSService.uploadFile(Bucket, frameData.filePath, s3Folder, '', "", function(err, data) {
            if (err) {
                utility.log('Upload err for ' + frameData.filePath, err);
                reject({err: err, type: 'OTHER'});
                return;
            }
            utility.log('Uploded frame number ', frameData.number);
            setTimeout(function() {
                getURLAndResolve(data);
            });
        });
    });
};

VideoService.prototype._checkAndInitFileUpload = function(frameData, callback) {
    var self = this;
    fs.exists(frameData.filePath, function(exists) {
        if (exists) {
            // setTimeout used for making it more async.
            setTimeout(function() {
                try {
                    var bucketConfig = awsConfig.buckets.codejudge;
                    var Bucket = bucketConfig.name;
                    var s3Folder = bucketConfig.paths.videos.segementedVideosPath;
                    var promise = self._uploadFrameFileAndGetURL(frameData, Bucket, s3Folder);
                    promise.then(function(url) {
                        callback(null, url);
                    }, function(err) {
                        callback(err);
                    });
                } catch (error) {
                    callback(err);
                }
            });
        } else {
            // setTimeout used for making it more async.
            setTimeout(function() {
                try {
                    self._checkAndInitFileUpload(frameData, callback);
                } catch (error) {
                    callback(error);
                }
            });
        }
    });
};

VideoService.prototype.deleteTempFiles = function() {
    try {
        for (var i = 0; i < this.filesToBeDeleted.length; i++) {
            fs.unlink(this.filesToBeDeleted[i], function() {});
        }
    } catch (error) {
        
    }
};

VideoService.prototype._runSegmentationCommand = function(frame) {
    var command = 'ffmpeg';
    var resolutionStr = this.getResolutionStr();
    var args;
    if (resolutionStr) {
        args = ['-fflags', '+discardcorrupt', '-ss', frame.offsetTime, '-i', '"' + frame.sourceFilePath + '"', '-t', Number(frame.duration),  '-s', resolutionStr, '-max_muxing_queue_size', '1024', '-c:v', 'libx264', '"' + frame.filePath + '"']; 
    } else {
        args = ['-fflags', '+discardcorrupt', '-ss', frame.offsetTime, '-i', '"' + frame.sourceFilePath + '"', '-t', Number(frame.duration),  '-max_muxing_queue_size', '1024', '-c:v', 'libx264', '"' + frame.filePath + '"']; 
    }
    utility.log('Going to run segmentation command for frame number ' + frame.number, command + ' ' + args.join(' '));
    return this._runCommand(command, args);
};

VideoService.prototype._performSegmentationAndUpload = function(frames) {
    var self = this;
    return new Promise(function(resolve, reject) {
        try {
            var resArr = [];
            var totalCount = frames.length;
            var uploadedCount = 0;

            var uploadCallback = function(frame, err, url) {
                if (err) {
                    reject({err: err, type: 'OTHER'});
                } else {
                    ++uploadedCount;
                    resArr[frame.index].video_url = url;
                    if (uploadedCount === totalCount) {
                        resolve(resArr);
                    }
                }
            };
            for (var i = 0; i < frames.length; i++) {
                var frame = frames[i];
                var _checkAndUpload = self._checkAndInitFileUpload.bind(self, frame, uploadCallback.bind(self, frame));
                self._runSegmentationCommand(frame).then(_checkAndUpload, function(error) {
                    utility.log('Error here ', error);
                    reject({err: error, type: 'OTHER'});
                });
                resArr.push({video_url: frame.filePath});
            }
        } catch (error) {
            reject({err: error, type: 'OTHER'});
        }
    });
};

VideoService.prototype.getVideoMetadata = function(filePath) {
    var self = this;
    return new Promise(function(resolve, reject) {
       try {
            var command = "ffprobe -v quiet -print_format json -show_format -show_streams \"" + filePath + "\"";
            child_process.exec(command, function(err, stdout, stderr) {
                if (err) {
                    reject({err: err, type: 'OTHER'});
                    return;
                }
                var metadata = JSON.parse(stdout);
                resolve(metadata);
            });
       } catch (error) {
            reject({err: error, type: 'OTHER'});
       }
    });
};

VideoService.prototype._segmentVideo = function(filePath, intervalDuration) {
    var self = this;
    return new Promise(function(resolve, reject) {
        self.getVideoMetadata(filePath)
            .then(function(metadata) {
                var duration = metadata.format.duration;
                if (duration < intervalDuration) {
                    reject({err: 'Error', type: 'INVALID_ARGUMENTS'});
                } else {
                    var frames = self._calculateFramesByInterval(duration, intervalDuration, filePath);
                    self._performSegmentationAndUpload(frames).then(resolve, reject);
                }
            }, function(error) {
                reject(error);
            });
    });
}; 


VideoService.prototype.segmentVideo = function(videoFilLinkURL, intervalDuration) {
    var self = this;
    utility.log('Starting segmentation process for the input file URL: ' + videoFilLinkURL);
    return new Promise(function(resolve, reject) {
        try {
            var promise = self._segmentVideo(videoFilLinkURL, intervalDuration);
            promise.then(function(data) {
                utility.log('Done');
                resolve(data);
                setTimeout(function() {
                   self.deleteTempFiles();
                });
            }, function(error) {
                setTimeout(function() {
                    self.deleteTempFiles();
                });
                reject(error);
            });
        } catch (error) {
            reject({err: error, type: 'OTHER'});
        }
    });
};


VideoService.prototype._checkWhenAllFrameFilesAvailable = function(frames) {
    var self = this;
    return new Promise(function(resolve, reject) {
        try {
            var totalCount = frames.length;
            var existCount = 0;

            var _checkFileRecursively = function(index) {
                var frameData  = frames[index];
                utility.log('Checking file ', index);
                fs.exists(frameData.filePath, function(exists) {
                    if (exists) {
                        utility.log('Available file ', index);
                        ++existCount;
                        if (existCount == totalCount) {
                            setTimeout(function() {
                                resolve();
                            });
                        }
                    } else {
                        // setTimeout used for making it more async.
                        setTimeout(function() {
                            try {
                                _checkFileRecursively(index);
                            } catch (error) {
                                reject(error);
                            }
                        });
                    }
                });
            };
            for (var i = 0; i < frames.length; i++) {
                _checkFileRecursively(i);
            }
        } catch (error) {
            reject(error);
        }
    });
};

VideoService.prototype._processVideosMergingOriginal = function(frames, destinationFile) {
    var self = this;
    return new Promise(function(resolve, reject) {
        var args = [];
        var filterComplex = '';
        for (var i = 0; i < frames.length; i++) {
            args.push('-i', '"' + frames[i].filePath + '"');
            filterComplex += '[' + i + ':v]';
        }
        var concat = 'concat=n=' + frames.length + ':v=1:a=0 [v]';
        filterComplex += ' ' + concat;
        args.push("-filter_complex", '"' + filterComplex + '"', "-map", '"[v]"', '"' + destinationFile + '"');
        var command = 'ffmpeg';
        self._runCommand(command, args).then(resolve, function(err) {
            reject({err: err, type: 'OTHER'});
        });
    });
};

VideoService.prototype._processVideosMergingCurrent = function(frames, destinationFile) {
    var self = this;
    return new Promise(function(resolve, reject) {
        var args = [];
        var filterComplex = '';
        for (var i = 0; i < frames.length; i++) {
            args.push('-i', '"' + frames[i].filePath + '"');
            filterComplex += '[' + i + ':v][' + i + ':a]';
        }
        var concat = 'concat=n=' + frames.length + ':v=1:a=1 [v][a]';
        filterComplex += ' ' + concat;
        args.push("-filter_complex", '"' + filterComplex + '"', "-map", '"[v]"', "-map", '"[a]"', '"' + destinationFile + '"');
        var command = 'ffmpeg';
        self._runCommand(command, args).then(resolve, function(err) {
            reject({err: err, type: 'OTHER'});
        });
    });
};

VideoService.prototype._processVideosMerging = function(frames, destinationFile) {
    var self = this;
    return new Promise(function(resolve, reject) {
        var args = [];
        var filterComplex = '';
        for (var i = 0; i < frames.length; i++) {
            args.push('-i', '"' + frames[i].filePath + '"');
            filterComplex += '[' + i + ':v][' + i + ':a]';
        }
        var concat = 'concat=n=' + frames.length + ':v=1:a=1 [v][a]';
        filterComplex += ' ' + concat;
        args.push('-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', "-filter_complex", '"' + filterComplex + '"', "-map", '"[v]"', "-map", '"[a]"', '"' + destinationFile + '"');
        var command = 'ffmpeg';
        self._runCommand(command, args).then(resolve, function(err) {
            reject({err: err, type: 'OTHER'});
        });
    });
};

VideoService.prototype._checkMergedFileExistence = function (filePath) {
    var self = this;
    return new Promise(function(resolve, reject) {
        try {
            var _checkAndInitiatUpload = function() {
                fs.exists(filePath, function(exists) {
                    try {
                        if (exists) {
                           resolve();
                        } else {
                            setTimeout(_checkAndInitiatUpload);
                        }
                    } catch (error) {
                        reject(err);
                    }
                });
            };
            _checkAndInitiatUpload();
        } catch (error) {
            reject(error);
        }
    });
};

VideoService.prototype._uploadMergedVideo = function(filePath) {
    var dummyFrame = this._makeFrameData(0, -1, 0, 0, '', filePath);
    var bucketConfig = awsConfig.buckets.codejudge;
    var Bucket = bucketConfig.name;
    var s3Folder = bucketConfig.paths.videos.combinedVideosPath;
    return this._uploadFrameFileAndGetURL(dummyFrame, Bucket, s3Folder);
};

VideoService.prototype._convertInputSegmentDataToFrameData = function(segments) {
    var frames = [];
    var self = this;
    for (var i = 0; i < segments.length; i++) {
        var segment = segments[i];
        var start = Number(segment.start);
        var end = Number(segment.end);
        var duration = end - start;
        var sourceFilePath = segment.video_url;
        var frame = self._makeFrameData((i + 1), i, duration, start, sourceFilePath, '');
        self._createFileForFrame(frame);
        frames.push(frame);
    }
    return frames;
};

VideoService.prototype._processResolution = function(sourceFilePath, resolution, destinationFile) {
    var self = this;
    return new Promise(function(resolve, reject) {
        try {
              var resolutionStr = resolution.width + 'x' + resolution.height;
              if (!destinationFile) {
                  var ext = utility.extname(sourceFilePath);
                   destinationFile = path.join(__dirname, '..', 'temp-files', 'final_merged_' + Date.now() + '_' + resolutionStr + ext);
                  self.filesToBeDeleted.push(destinationFile);
              }
              var args = ['-i', '"' + sourceFilePath + '"', '-s', resolutionStr, '-c:a', 'copy','"' + destinationFile + '"'];
              var command = 'ffmpeg';
              self._runCommand(command, args).then(function() {
                  resolve(destinationFile);
              }, function(err) {
                  reject({err: err, type: 'OTHER'});
              });
              
        } catch (error) {
            reject(error);
        }
    });  
  };

VideoService.prototype._validateVideoFrameToBeCombined = function(frameData) {
    var self = this;
    return new Promise(function(_resolve, _reject) {
        try {
            var start = frameData.offsetTime;
            var duration = frameData.duration;
            var end = start + duration;

            if (end <= start) {
                return _resolve(false);
            }
            self.getVideoMetadata(frameData.sourceFilePath).then(function(metadata) {
                var actualDuration = metadata.format.duration;
                if (actualDuration < duration) {
                    return _resolve(false);
                }
                if (end > actualDuration) {
                    return _resolve(false);
                }
                setTimeout(_resolve, 0, true);
            }, function(error) {
                _reject(error);
            } );

        } catch (error) {
            _reject(error);
        }
    });
};

VideoService.prototype._validateFramesToBeCombined = function(frames) {
    var self = this;
    return new Promise(function(resolve, reject) {
        try {
            var totalCount = frames.length;
            var processedCount = 0;
            var invalidVideosCount = 0;

            var _validate = function(frameData) {
                self._validateVideoFrameToBeCombined(frameData).then(function(isValid) {
                    ++processedCount;
                    if (!isValid) {
                        ++invalidVideosCount;
                        utility.log('Invalid frame ', frameData);
                    }
                    if (processedCount == totalCount) {
                        if (invalidVideosCount) {
                            reject({err: 'Invalid segments.', type: 'INVALID_ARGUMENTS'});
                        } else {
                            resolve();
                        }
                    }
                }, function(error) {
                    reject({err: error, type: 'OTHER'});
                });
               
            };
            for (var i = 0; i < frames.length; i++) {
                setTimeout(_validate, 0, frames[i]);
            }
        } catch (error) {
            reject({err: error, type: 'OTHER'});
        }
    });
}; 

VideoService.prototype._combineVideos = function(frames, finalVideoResolution, destinationFile) {
    var self = this;
    return new Promise(function(resolve, reject) {
        try {
            self._processVideosMerging(frames, destinationFile, finalVideoResolution).then(function() {
                utility.log('Combined but file not available. Checking for file availability....');
                self._checkMergedFileExistence(destinationFile).then(function() {
                    utility.log('Merged File is available now. Now uploading...');
                    setTimeout(function() {
                        self._uploadMergedVideo(destinationFile).then(function(s3URL) {
                            utility.log('Upload finished.');
                            utility.log('All done.');
                            resolve(s3URL);
                            self.deleteTempFiles();
                        });
                    });
                }, function(error) {
                    reject({err: error, type: 'OTHER'});    
                });
            }, function(error) {
                reject({err: error, type: 'OTHER'});    
            });
        } catch (error) {
            reject({type: 'OTHER', err: error});
        }
    });
};

 VideoService.prototype._createVideoFramesToBeMerged = function(frames) {
    var promiseArr = [];
    for (var i = 0; i < frames.length; i++) {
        var frame = frames[i];
        promiseArr.push(this._runSegmentationCommand(frame));
    }
    return Promise.all(promiseArr);
 };

VideoService.prototype.combineVideos = function(segments, finalVideoResolution) {
    var self = this;
    return new Promise(function(resolve, reject) {
        try {
            utility.log('Received segments to be combined: ', segments, finalVideoResolution);
            self.resulution = finalVideoResolution;
            var frames = self._convertInputSegmentDataToFrameData(segments);
            utility.log('Created frames. Validating now....');
            self._validateFramesToBeCombined(frames).then(function() {
                utility.log('Validation done. Creating segments...');
                var promise = self._createVideoFramesToBeMerged(frames);
                promise.then(function(dataArr) {
                    utility.log('Segmentation done, but files are not available, checkinf file....');
                    self._checkWhenAllFrameFilesAvailable(frames).then(function() {
                        utility.log('All segmented files are available. Starting merge process...');
                        var ext = '.mp4';//utility.extname(frames[0].sourceFilePath);
                        var destinationFile = path.join(__dirname, '..', 'temp-files', 'merged_' + Date.now() + '_' + ext);
                        self.filesToBeDeleted.push(destinationFile);
                        self._combineVideos(frames, finalVideoResolution, destinationFile).then(resolve, reject);
                    }, function(error) {
                        reject({err: error, type: 'OTHER'});    
                    });
                }, function(error) {
                    utility.log('Error here ', error);
                    reject({err: error, type: 'OTHER'});
                });
            }, function(err) {
                reject(err);
            });
        } catch (error) {
            utility.log(error);
            reject({type: 'OTHER', err: error});
        }
    });

};

module.exports = VideoService;
