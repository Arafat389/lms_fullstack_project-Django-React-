// frontend/src/pages/CategoryPage.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
// Link, useParams, useNavigate are imported but not used in the provided JSX logic.
// If you don't use them elsewhere in this file, consider removing them.
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css'; // For styling

const CategoryPage = () => {
    const [categories, setCategories] = useState([]);
    const [currentCategory, setCurrentCategory] = useState(null); // For editing
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth(); // To check if user is authenticated for CRUD operations
    const navigate = useNavigate(); // Only keep if you plan to use it for navigation, e.g., navigate('/some-route');

    // Fetch categories function
    const fetchCategories = useCallback(async () => {
        setLoading(true);
        setError(''); // Clear any previous errors
        try {
            const response = await api.get('categories/');
            // --- FIX START: Safely extract categories from response data ---
            if (Array.isArray(response.data)) {
                setCategories(response.data);
            } else if (response.data && Array.isArray(response.data.results)) {
                // Common for paginated Django REST Framework APIs
                setCategories(response.data.results);
            } else {
                // If the API response structure is unexpected
                console.error("Unexpected API response structure for categories:", response.data);
                setError('Received unexpected data format for categories. Please check your backend API.');
                setCategories([]); // Ensure it's an array to prevent .map() error
            }
            // --- FIX END ---
        } catch (err) {
            setError('Failed to fetch categories. You might need to log in or there might be a server issue.');
            console.error('Error fetching categories:', err.response ? err.response.data : err.message);
            setCategories([]); // Ensure categories is an empty array on error
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array for useCallback ensures this function is stable

    // Effect to fetch categories on component mount
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]); // Dependent on fetchCategories, which is stable due to useCallback

    // Handle editing a category
    const handleEditClick = (category) => {
        setCurrentCategory(category);
        setFormName(category.name);
        setFormDescription(category.description || ''); // Handle potentially null/undefined description
        setError(''); // Clear form errors when starting edit
    };

    // Handle form submission (Create or Update)
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous submission errors
        setIsSubmitting(true);

        // Basic validation for name
        if (!formName.trim()) {
            setError('Category name cannot be empty.');
            setIsSubmitting(false);
            return;
        }

        const categoryData = {
            name: formName,
            description: formDescription, // Send description even if empty string
        };

        try {
            if (currentCategory) {
                // Update existing category
                await api.put(`categories/${currentCategory.id}/`, categoryData);
            } else {
                // Create new category
                await api.post('categories/', categoryData);
            }
            // Refresh list and clear form
            fetchCategories(); // Re-fetch all categories to update the list
            setCurrentCategory(null);
            setFormName('');
            setFormDescription('');
            setError(''); // Clear errors after successful submission
        } catch (err) {
            // More robust error message extraction
            const errorDetail = err.response?.data
                ? (typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : err.response.data)
                : err.message;
            setError(`Failed to save category: ${errorDetail}. Make sure you are logged in and have permission.`);
            console.error('Error saving category:', err.response || err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle deleting a category
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            return;
        }
        setError(''); // Clear previous errors
        try {
            await api.delete(`categories/${id}/`);
            fetchCategories(); // Refresh the list
            if (currentCategory && currentCategory.id === id) {
                // If the deleted category was being edited, clear the form
                setCurrentCategory(null);
                setFormName('');
                setFormDescription('');
            }
        } catch (err) {
            const errorDetail = err.response?.data
                ? (typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : err.response.data)
                : err.message;
            setError(`Failed to delete category: ${errorDetail}. You might not have permission or there are courses linked to it.`);
            console.error('Error deleting category:', err.response || err.message);
        }
    };

    // --- Conditional Rendering for Loading and Error States ---
    if (loading) return <div className="loading-message">Loading categories...</div>;

    // Display a general error if fetching failed and we're not submitting a form
    if (error && !isSubmitting) return <div className="error-message">Error: {error}</div>;

    return (
        <div className="page-container">
            <h1>Manage Categories</h1>

            {/* Category Form (Create/Edit) */}
            {user && ( // Only show form if user is logged in
                <div className="form-container">
                    <h3>{currentCategory ? 'Edit Category' : 'Add New Category'}</h3>
                    {/* Display form-specific errors */}
                    {error && <p className="error-message">{error}</p>}
                    <form onSubmit={handleFormSubmit}>
                        <div>
                            <label htmlFor="category-name">Name:</label>
                            <input
                                type="text"
                                id="category-name"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <label htmlFor="category-description">Description:</label>
                            <textarea
                                id="category-description"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                rows="3"
                                disabled={isSubmitting}
                            ></textarea>
                        </div>
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : (currentCategory ? 'Update Category' : 'Add Category')}
                        </button>
                        {currentCategory && (
                            <button type="button" onClick={() => {
                                setCurrentCategory(null);
                                setFormName('');
                                setFormDescription('');
                                setError(''); // Clear error when canceling edit
                            }} disabled={isSubmitting}>
                                Cancel
                            </button>
                        )}
                    </form>
                </div>
            )}

            {/* Category List */}
            <div className="list-container">
                <h3>Existing Categories</h3>
                {/* Check if categories is an array and if it's empty */}
                {Array.isArray(categories) && categories.length === 0 && !loading && <p>No categories found. {user && 'Use the form above to add one.'}</p>}
                <ul>
                    {/* --- FIX: Crucial check for .map() method --- */}
                    {Array.isArray(categories) && categories.map(category => (
                        <li key={category.id}>
                            <h4>{category.name}</h4>
                            <p>{category.description || 'No description provided.'}</p>
                            {user && (
                                <div className="actions">
                                    <button onClick={() => handleEditClick(category)} className="edit-button">Edit</button>
                                    <button onClick={() => handleDelete(category.id)} className="delete-button">Delete</button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default CategoryPage;