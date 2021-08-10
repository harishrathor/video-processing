import { Injectable } from '@angular/core';
import { contentTypeAndExtMapping } from '../configs/consts.config';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

    constructor() { }

    public getExtAndContentType(path) {
        const videoURLParts = path.split('.');
        const extension = '.' + videoURLParts[videoURLParts.length - 1]; 
        const contentType = contentTypeAndExtMapping[extension];
        return {extension, contentType};
    }

    public validateURL(url) {
      var re = "http[s]?://.+";//'^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}'
      let pattern = new RegExp(re); // fragment locator
      return !!pattern.test(url);
    }
}
