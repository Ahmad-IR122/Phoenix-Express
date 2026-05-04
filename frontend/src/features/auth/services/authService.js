import axios from "axios";
import API from "../../../apis/api";

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

export const changePassword = (data, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return API.patch("/auth/change-password", data, { headers });
};
