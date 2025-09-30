// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "studio-7743848061-9f621",
  "appId": "1:944605529409:web:34a5b469a6b2dc4a1acdc0",
  "apiKey": "AIzaSyD8I0Ez_9b0vChO5hfrBQJ0cGYJlHsFgm4",
  "authDomain": "studio-7743848061-9f621.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "944605529409"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
