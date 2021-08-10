import { UtilService } from './../../services/util.service';
import { contentTypeAndExtMapping } from './../../configs/consts.config';
import { Video, SplitVideoResponsData } from './../../interfaces/video-processing.interface';
import { ApiService } from './../../services/api.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-split-video',
  templateUrl: './split-video.component.html',
  styleUrls: ['./split-video.component.scss']
})
export class SplitVideoComponent implements OnInit {

    public videoURLModel: string;
    public intervalTimeModel: string;
    public processingMessage: string;
    public inputVideoContentType: string;
    public inputVideoExt: string;
    public segmentSettingModel: string;
    public isValidInputs: boolean;
    protected _videoSegments: Video[];


    constructor(protected _apiService: ApiService, protected _util: UtilService) { }

    ngOnInit() {
        this._videoSegments = [];
        this._initInputs();
        this.validateUserInput();
    }

    protected _initInputs() {
        this.isValidInputs = false;
        this.processingMessage = '';
        this._videoSegments = []
        this._clearInputs();
        
    }

    protected _clearInputs() {
        this.segmentSettingModel = '';//Interval Duration
        this.intervalTimeModel = '';
        this.videoURLModel = '';
    }

    public validateUserInput() {
        var valid = true;        
        if (!this.videoURLModel || !this._util.validateURL(this.videoURLModel)) {
            valid = false;
        } else if (!this.segmentSettingModel || this.segmentSettingModel !== 'Interval Duration') {
            valid = false;
        } else if (this.segmentSettingModel) {
            const interval = Number(this.intervalTimeModel);
            if (isNaN(interval) || !interval || interval < 0) {
                valid = false;
            }
        }
        this.isValidInputs = valid;
        return valid;
    }

    processVideo() {
        const {contentType, extension} = this._util.getExtAndContentType(this.videoURLModel);
        this.inputVideoExt = extension; 
        this.inputVideoContentType = contentType;
        this.processingMessage = 'Processing video.';        
        this._videoSegments = [];
        this._apiService.splitVideo({
            video_link: this.videoURLModel,
            interval_duration: this.intervalTimeModel
        }).subscribe((response: SplitVideoResponsData) => {
            this.processingMessage = 'Video processing done.';
            this._videoSegments = response.interval_videos;
            this._clearInputs();
        }, error => {
            console.log('Error in processing video:', error);
            this.processingMessage = error.message;
        });
    }

    get videoSegments() {
        return this._videoSegments;
    }
    

}
