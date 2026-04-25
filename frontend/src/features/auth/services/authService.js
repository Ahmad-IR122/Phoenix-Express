import API from "../../../apis/api";

export const registerUser = (data) => {
    return API.post("/auth", data);
};

export const loginUser = (data) => {
    return API.post("/auth/login", data);
};

export const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};


