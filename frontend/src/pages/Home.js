// frontend/src/pages/Home.js
import React from 'react';
import { useAuth } from '../context/AuthContext'; // Optional: to show personalized message

const Home = () => {
    const { user } = useAuth();
    return (
        <div className="page-container">
            <h2>Welcome to the Learning Management System!</h2>
            {user ? (
                <p>Hello, {user.username}! Start exploring courses or manage your content.</p>
            ) : (
                <p>Please register or log in to access all features.</p>
            )}
            <p>This is a full-stack LMS project built with Django REST Framework and React.</p>
        </div>
    );
};

export default Home;