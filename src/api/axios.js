import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000/api", // adapte selon ton backend
});

export default API;