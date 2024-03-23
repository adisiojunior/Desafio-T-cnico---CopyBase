// apiService.js

import axios from 'axios';

const API_URL = process.env.VUE_APP_API_ULR_PROD;

export default {
  uploadFile(formData) {
    return axios.post(`${API_URL}api/upload/`, formData);
  }
};
