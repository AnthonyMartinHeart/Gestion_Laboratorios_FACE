import axios from "axios";

const api = axios.create({
  baseURL: process.env.ELECTRON_API_BASE_URL || "http://localhost:3001/api",
  timeout: 5000,
});

export default api;
