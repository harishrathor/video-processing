import { environment } from '../../environments/environment';
let baseURL = environment.apiUrl;
if (!baseURL) {
    baseURL = '';
}
export const COMBINE_VIDEO = `${baseURL}/api/combine-video`;
export const SPLIT_VIDEO = `${baseURL}/api/process-interval`;