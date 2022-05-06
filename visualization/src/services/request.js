import _ from 'lodash';
import axios from 'axios';

const requestService = {
  makeRequest: ({ method, host, path, query = {}, body = null, headers = {} } = {}) => {
    axios.method({
      url: path,
      method,
      baseURL: host,
      headers,
      params: query,
      data: body,

      onUploadProgress: progressEvent => console.log('upload progress', progressEvent),
      onDownloadProgress: progressEvent => console.log('download progress', progressEvent),
    });
  },

  /**
   * Creates a new instance of axios with custom options and returns it
   * @param {string} name all names are allowed except 'createInstance' and 'makeRequest'
   * @param {string} method GET, POST, PUT, DELETE etc.
   * @param {string} host to send requests to
   * @param {string} path to send requests to
   * @param {object} query object that is going to be added to the url
   * @param {object} body to be sent in the requests
   * @param {object} headers to be set in the requests
   * @return {object} new axios instance
   */
  createInstance: (name, { method, host, path, query, body, headers }) => {
    if (_.includes(['createInstance', 'makeRequest'], name)) {
      throw new Error('createInstance and makeRequest are not allowed as name of axios instance');
    }
    if (_.has(requestService, name)) {
      throw new Error(`Instance with the name "${name}" is already defined`);
    }
    requestService[name] = axios.create({
      method,
      host,
      path,
      query,
      body,
      headers,
    });

    return requestService[name];
  },
};

export default requestService;
