var express = require('express');
var router = express.Router();
var VideoService = require('../services/video.service');
var utility = require('../services/utility.service');
utility.enableLogging();
router
.route('/process-interval')
.post(function(req, res) {
    console.log('Process interval');
    var videoLink = req.body.video_link;
    var intervalDuration = req.body.interval_duration;
    utility.log('Process interval Request received.');
    if (!videoLink) {
        res.status(422).send({
            "reason": "could not process file 1.",
            body: req.body
        }).end();
    } else if (!intervalDuration) {
        res.status(422).send({
            "reason": "could not process file 2 ",
            body: req.body
        }).end();
    } else {
        intervalDuration = Number(intervalDuration);
        try {
            var vidService = new VideoService();
            vidService.segmentVideo(videoLink, intervalDuration).then(function(segmentsArr) {
                console.log('Sending response.');
                res.json({
                    interval_videos: segmentsArr
                }).end();
            }, function(errInfo) {
                utility.log(errInfo);
                vidService.deleteTempFiles();
                if (errInfo.type == 'INVALID_ARGUMENTS') {
                    res.status(400).json({
                        "reason": "invalid interval duration. " + errInfo.type
                    }).end();
                } else {
                    res.status(422).json({
                        "reason": "could not process file 3 " + errInfo.type
                    }).end();
                }
            });
        } catch (error) {            
            res.status(422).end("could not process file 4 "  + error.type);
        }
    }
});

router.route('/combine-video')
.post(function(req, res) {
    var body = req.body;
    var segments = body.segments;
    var height = body.height;
    var width = body.width;
    var segmentsArr = segments;
    if (typeof segmentsArr == 'string') {
        try {
            segmentsArr = JSON.parse(segmentsArr);
        } catch (error) {
            res.status(422).json({
                "reason": "could not process file 1 "
            }).end();
            return;
        }
    }
    var vidService = new VideoService();
    vidService.combineVideos(segmentsArr, {height: height, width: width}).then(function(videoURL) {
        res.json({
            video_url: videoURL
        }).end();
    }, function(errInfo) {
        utility.log(errInfo);
        vidService.deleteTempFiles();
        if (errInfo.type == 'INVALID_ARGUMENTS') {
            res.status(400).json({
                reason: "invalid input arguments"
            }).end();
        } else {
            res.status(422).json({
                "reason": "could not process file 2 "
            }).end();
        }
    });
})
;

module.exports = router;
