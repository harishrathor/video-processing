import { SplitVideoData, SplitVideoResponsData, CombineVideoData, Video } from './../interfaces/video-processing.interface';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay, timeout } from 'rxjs/operators';
import { SPLIT_VIDEO, COMBINE_VIDEO } from '../configs/api.config';




@Injectable({
  providedIn: 'root'
})
export class ApiService {

    constructor(protected _http: HttpClient) { }

    public splitVideo(videoData: SplitVideoData): Observable<SplitVideoResponsData> {
        return this._http.post<SplitVideoResponsData>(SPLIT_VIDEO, videoData)/* .pipe(timeout(600000), shareReplay()) */;
    }

    public combineVideos(videosData: CombineVideoData): Observable<Video> {
        return this._http.post<Video>(COMBINE_VIDEO, videosData)/* .pipe(timeout(600000), shareReplay()) */;
    }
}
