module.exports = {
    credentials: {
        accessKeyId: 'AKIAJWH7D3IJCXBQWQWQ',
        secretAccessKey: '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'
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