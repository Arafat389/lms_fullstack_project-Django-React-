// frontend/src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/Home';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import CategoryPage from './pages/CategoryPage'; // Combines list and form
import CoursePage from './pages/CoursePage';     // Combines list and form
import './App.css'; // Import your main CSS file

function App() {
    return (
        <div className="App">
            <Navbar /> {/* Navbar outside of Routes to be always visible */}
            <div className="content">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/login" element={<LoginPage />} />

                    {/* Protected Routes - only accessible when logged in */}
                    <Route element={<PrivateRoute />}>
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/categories" element={<CategoryPage />} /> {/* Categories CRUD */}
                        <Route path="/courses" element={<CoursePage />} />       {/* Courses CRUD */}
                    </Route>

                    {/* Fallback for undefined routes */}
                    <Route path="*" element={<h2>404: Page Not Found</h2>} />
                </Routes>
            </div>
        </div>
    );
}

export default App;