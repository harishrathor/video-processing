import { UtilService } from './../../services/util.service';
import { ApiService } from './../../services/api.service';
import { CombineVideoData, SegmentData, Video } from './../../interfaces/video-processing.interface';
import { Component, OnInit } from '@angular/core';
import { contentTypeAndExtMapping } from 'src/app/configs/consts.config';

@Component({
  selector: 'app-combine-video',
  templateUrl: './combine-video.component.html',
  styleUrls: ['./combine-video.component.scss']
})
export class CombineVideoComponent implements OnInit {

    public segmentsModelArr: SegmentData[];
    public outputVideoHeightModel: string;
    public outputVideoWidthModel: string;
    public processingMessage: string;
    public combinedVideoURL: string | null;
    public combinedVidExtName: string;
    public combinedVidContentType: string;
    public validInputs: boolean;

    constructor(protected _apiService: ApiService, protected _util: UtilService) { }

    ngOnInit() {
        this.processingMessage = '';
        this.validInputs = false;
        this.outputVideoHeightModel = '';
        this.outputVideoWidthModel = '';
        this.combinedVideoURL = null;
        this.segmentsModelArr = [];
        this.combinedVidExtName = '.mp4';
        this.combinedVidContentType = contentTypeAndExtMapping[this.combinedVidExtName];
        this.validateUserInput();
    }

    public addNewSegmentModel() {
        const newSegementModel: SegmentData = {
            video_url: '',
            start: '', 
            end: ''
        };
        this.segmentsModelArr.push(newSegementModel);
        this.validateUserInput();
    }

    public removeSegmentModel(index: number) {
        if (this.segmentsModelArr[index]) {
            this.segmentsModelArr.splice(index, 1);
            this.validateUserInput();
        }
    }

    public _validateSegmentModel(modelData) {
        if (!modelData.video_url || !this._util.validateURL(modelData.video_url)) {
            return false;
        } 
        const start = Number(modelData.start);
        if (isNaN(start) || start < 0) {
            return false;
        }
        const end = Number(modelData.end);
        if (isNaN(end) || end <= 0) {
            return false;
        }
        if (end <= start) {
            return false;
        }
        return true;
    }

    public validateUserInput() {
        const width = Number(this.outputVideoWidthModel);
        const height = Number(this.outputVideoHeightModel);
        if (isNaN(width) || isNaN(height) || !height || !width) {
            this.validInputs = false;
            return false;
        }
        let valid = !!this.segmentsModelArr.length;
        if (!valid) {
            this.validInputs = valid;
            return valid;
        }
        for (let index = 0; index < this.segmentsModelArr.length; index++) {
            const modelData = this.segmentsModelArr[index];
            if (!this._validateSegmentModel(modelData)) {
                valid = false;
                console.log('Invalid  2 ' , index, modelData);
                break;
            } 
        }
        this.validInputs = valid;
        return valid;
    }

    protected _getValidSegmentsData() {
        let segmentsArr = [];
        for (let index = 0; index < this.segmentsModelArr.length; index++) {
            const modelData = this.segmentsModelArr[index];
            if (this._validateSegmentModel(modelData)) {
                segmentsArr.push(modelData);
            }
        }
        return segmentsArr;
    }

    public combineVideos() {
        if (this.segmentsModelArr.length < 2) {
            return;
        }
        this.processingMessage = 'Merging videos.';
        this.combinedVideoURL = null;
        const data: CombineVideoData = {
            segments: this._getValidSegmentsData(),
            height: this.outputVideoHeightModel,
            width: this.outputVideoWidthModel
        };
        this._apiService.combineVideos(data).subscribe((response: Video) =>{
            this.combinedVideoURL = response.video_url;
            this.processingMessage = 'Video Processed.'
        }, error => {
            console.log('Error in processing video:', error);
            this.processingMessage = error.message;
        });
    }

}
