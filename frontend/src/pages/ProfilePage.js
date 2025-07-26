import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../App.css';

const ProfilePage = () => {
    // ✅ All hooks at top-level
    const { user, loading, getUserProfile, updateUserProfile, logout } = useAuth();

    const [profileData, setProfileData] = useState(user || {});
    const [editing, setEditing] = useState(false);
    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!user && !loading) {
            getUserProfile();
        } else if (user) {
            setProfileData(user);
        }
    }, [user, loading, getUserProfile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async () => {
        setMessage('');
        setIsSaving(true);
        const dataToUpdate = {
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            email: profileData.email,
        };
        const success = await updateUserProfile(dataToUpdate);
        if (success) {
            setMessage('Profile updated successfully!');
            setEditing(false);
        } else {
            setMessage('Failed to update profile. Please check the data.');
        }
        setIsSaving(false);
    };

    if (loading || !user) {
        return <div className="loading-message">Loading user profile...</div>;
    }

    return (
        <div className="profile-container">
            <h2>User Profile</h2>
            {message && <p className={message.includes('successfully') ? 'success-message' : 'error-message'}>{message}</p>}

            {editing ? (
                <form>
                    <div>
                        <label>Username:</label>
                        <input type="text" value={profileData.username || ''} disabled />
                    </div>
                    <div>
                        <label htmlFor="profile-email">Email:</label>
                        <input type="email" id="profile-email" name="email" value={profileData.email || ''} onChange={handleChange} disabled={isSaving} />
                    </div>
                    <div>
                        <label htmlFor="profile-first-name">First Name:</label>
                        <input type="text" id="profile-first-name" name="first_name" value={profileData.first_name || ''} onChange={handleChange} disabled={isSaving} />
                    </div>
                    <div>
                        <label htmlFor="profile-last-name">Last Name:</label>
                        <input type="text" id="profile-last-name" name="last_name" value={profileData.last_name || ''} onChange={handleChange} disabled={isSaving} />
                    </div>
                    <button type="button" onClick={handleUpdate} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={() => setEditing(false)} disabled={isSaving}>
                        Cancel
                    </button>
                </form>
            ) : (
                <div>
                    <p><strong>ID:</strong> {user.id}</p>
                    <p><strong>Username:</strong> {user.username}</p>
                    <p><strong>Email:</strong> {user.email || 'N/A'}</p>
                    <p><strong>First Name:</strong> {user.first_name || 'N/A'}</p>
                    <p><strong>Last Name:</strong> {user.last_name || 'N/A'}</p>
                    <button onClick={() => setEditing(true)}>Edit Profile</button>
                    <button onClick={logout} className="logout-button">Logout</button> {/* ✅ Fixed */}
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
