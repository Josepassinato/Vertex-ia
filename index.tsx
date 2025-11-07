
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// TODO: Replace with your project's actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBipKOtPkStVsh_QF4iuFm7Y6CvESKh3FvA",
  authDomain: "gen-lang-client-0912581918.firebaseapp.com", // Example: my-cool-project-12345.firebaseapp.com
  projectId: "gen-lang-client-0912581918", // Example: my-cool-project-12345
  storageBucket: "gen-lang-client-0912581918.appspot.com", // Example: my-cool-project-12345.appspot.com
  messagingSenderId: "934903415689",
  appId: "1:934903415689:web:ca56c188d53a91581758"
};

// Check if Firebase config placeholders are still present
if (
  firebaseConfig.apiKey === "YOUR_FIREBASE_API_KEY" ||
  firebaseConfig.authDomain === "your-project-id.firebaseapp.com" ||
  firebaseConfig.projectId === "your-project-id" ||
  firebaseConfig.storageBucket === "your-project-id.appspot.com" ||
  firebaseConfig.messagingSenderId === "YOUR_SENDER_ID" ||
  firebaseConfig.appId === "YOUR_APP_ID"
) {
  console.warn(
    "ATENÇÃO: As configurações do Firebase ainda contêm valores de placeholder. " +
      "Por favor, atualize 'firebaseConfig' em index.tsx com suas credenciais reais do Firebase " +
      "para que o aplicativo funcione corretamente."
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Create a React Context for Firebase services
export const FirebaseContext = React.createContext({ app, auth, db });

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <FirebaseContext.Provider value={{ app, auth, db }}>
      <App />
    </FirebaseContext.Provider>
  </React.StrictMode>
);