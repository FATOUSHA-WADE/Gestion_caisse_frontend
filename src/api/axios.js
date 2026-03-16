import axios from "axios";

const API = axios.create({
  baseURL: "https://gestion-caisse.onrender.com/api" // adapte selon ton backend
});

//  const API = axios.create({
//   baseURL: "http://localhost:3000/api"// adapte selon ton backend
// }); 
export default API;