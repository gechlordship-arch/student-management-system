import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ REPLACE THIS WITH YOUR COMPUTER'S IP ADDRESS!
const MY_IP_ADDRESS = 'http:// 172.16.138.240:3000/api'; 

const api = axios.create({
  baseURL: MY_IP_ADDRESS,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;