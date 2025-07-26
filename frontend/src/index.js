// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Your global CSS file (we'll add this later)
import App from './App';
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
import { BrowserRouter as Router } from 'react-router-dom'; // Import Router here

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router> {/* Wrap the entire application with Router */}
      <AuthProvider> {/* Wrap the App component with AuthProvider */}
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>
);