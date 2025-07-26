// frontend/src/components/PrivateRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        // Render a loading state while authentication status is being determined
        return <div className="loading-message">Loading...</div>;
    }

    // If user is authenticated, render the child routes; otherwise, redirect to login
    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;