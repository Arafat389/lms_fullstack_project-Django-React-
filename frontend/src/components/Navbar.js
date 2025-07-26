// frontend/src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css'; // For styling the navbar

const Navbar = () => {
    const { user, logout, loading } = useAuth(); // Destructure user, logout, and loading state

    // Don't render navigation until auth status is known
    if (loading) {
        return <nav className="navbar"><p>Loading navigation...</p></nav>;
    }

    return (
        <nav className="navbar">
            <div className="navbar-brand"><Link to="/">LMS</Link></div>
            <ul className="navbar-links">
                <li><Link to="/">Home</Link></li>
                {user ? (
                    <>
                        <li><Link to="/categories">Categories</Link></li>
                        <li><Link to="/courses">Courses</Link></li>
                        <li><Link to="/profile">Profile ({user.username})</Link></li>
                        <li><button onClick={logout} className="logout-button">Logout</button></li>
                    </>
                ) : (
                    <>
                        <li><Link to="/register">Register</Link></li>
                        <li><Link to="/login">Login</Link></li>
                    </>
                )}
            </ul>
        </nav>
    );
};

export default Navbar;