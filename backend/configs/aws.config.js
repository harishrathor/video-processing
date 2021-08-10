module.exports = {
    credentials: {
        accessKeyId: ${{secrets.AWS_ACCESS_KEY_ID_1}},
        secretAccessKey: ${{secrets.AWS_SECRET_ACCESS_KEY_ID_1}}
    },
    buckets: {
        codejudge: {
            name: 'video-processing-store',
            paths: {
                videos: {
                    originalVideos: 'videos/original-videos',
                    combinedVideosPath: 'videos/processed/combined-videos',
                    segementedVideosPath: 'videos/processed/segmented-videos'
                } 
            }
        }
    }
};
