export interface SplitVideoData {
    video_link: string;
    interval_duration: string;
}

export interface SplitVideoResponsData {
    interval_videos: Video[];
}

export interface SegmentData {
    video_url: string;
    start: string;
    end: string;
};

export interface CombineVideoData {
    segments: SegmentData[];
    height: string;
    width: string;
}

export interface Video {
    video_url: string;
}

