import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

export const registerUser = (data) => {
    return axios.post(`${API_URL}/register`, data);
};

export const loginUser = (data) => {
    return axios.post(`${API_URL}/login`, data);
};
export const forgotPassword = (data) => {
    return axios.post(`${API_URL}/forgot-password`, data);
};

export const resetPassword = (data) => {
    return axios.post(`${API_URL}/reset-password`, data);
};