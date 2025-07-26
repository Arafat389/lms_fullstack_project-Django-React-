// frontend/src/pages/CoursePage.js
import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
// Link, useParams, useNavigate are imported but not used in the provided JSX.
// If you don't use them anywhere else, you can remove them to clean up warnings.
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css'; // For styling

const CoursePage = () => {
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]); // For dropdown in form
    const [currentCourse, setCurrentCourse] = useState(null); // For editing
    const [formTitle, setFormTitle] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formPrice, setFormPrice] = useState('');
    const [formDurationHours, setFormDurationHours] = useState('');
    const [formCategory, setFormCategory] = useState(''); // Category ID
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth(); // To check if user is authenticated for CRUD operations
    const navigate = useNavigate(); // This is imported but not used in the provided code snippet's logic. If you use it elsewhere (e.g., for redirection after an action), keep it. Otherwise, remove.

    // Fetch courses function
    const fetchCourses = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get('courses/');
            // --- FIX START ---
            // Check if the response data is an array directly, or if it's an object with a 'results' array
            if (Array.isArray(response.data)) {
                setCourses(response.data);
            } else if (response.data && Array.isArray(response.data.results)) {
                setCourses(response.data.results);
            } else {
                // If the data structure is unexpected, log it and set courses to an empty array
                console.error("Unexpected API response structure for courses:", response.data);
                setError('Received unexpected data format for courses. Please check the API response.');
                setCourses([]); // Ensure it's an array to prevent .map() error
            }
            // --- FIX END ---
        } catch (err) {
            setError('Failed to fetch courses. Please log in or try again.');
            console.error('Error fetching courses:', err.response ? err.response.data : err.message);
            setCourses([]); // Ensure courses is an empty array on error
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch categories for the dropdown
    const fetchCategoriesForDropdown = useCallback(async () => {
        try {
            const response = await api.get('categories/');
            // Similar check for categories, assuming it could also be paginated
            if (Array.isArray(response.data)) {
                setCategories(response.data);
            } else if (response.data && Array.isArray(response.data.results)) {
                setCategories(response.data.results);
            } else {
                console.error("Unexpected API response structure for categories:", response.data);
                setError('Could not load categories for the form due to unexpected data.');
                setCategories([]);
            }
        } catch (err) {
            console.error('Failed to fetch categories for dropdown:', err);
            setError('Could not load categories for the form.');
            setCategories([]); // Ensure categories is an empty array on error
        }
    }, []);

    // Effect to fetch courses and categories on component mount
    useEffect(() => {
        fetchCourses();
        fetchCategoriesForDropdown();
    }, [fetchCourses, fetchCategoriesForDropdown]);

    // Handle editing a course
    const handleEditClick = (course) => {
        setCurrentCourse(course);
        setFormTitle(course.title);
        setFormDescription(course.description);
        setFormPrice(course.price);
        setFormDurationHours(course.duration_hours || '');
        setFormCategory(course.category || ''); // Category ID
        setError(''); // Clear form errors
    };

    // Handle form submission (Create or Update)
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        // Basic validation
        if (!formCategory) {
            setError('Please select a category.');
            setIsSubmitting(false);
            return;
        }

        const courseData = {
            title: formTitle,
            description: formDescription,
            price: parseFloat(formPrice), // Ensure price is a number
            duration_hours: formDurationHours ? parseInt(formDurationHours) : null, // Ensure int or null
            category: parseInt(formCategory), // Ensure category is an integer ID
        };

        try {
            if (currentCourse) {
                // Update existing course
                await api.put(`courses/${currentCourse.id}/`, courseData);
            } else {
                // Create new course
                await api.post('courses/', courseData);
            }
            // Refresh list and clear form
            fetchCourses();
            setCurrentCourse(null);
            setFormTitle('');
            setFormDescription('');
            setFormPrice('');
            setFormDurationHours('');
            setFormCategory('');
        } catch (err) {
            const errorMsg = err.response && err.response.data
                ? (typeof err.response.data === 'object' ? JSON.stringify(err.response.data) : err.response.data)
                : err.message;
            setError(`Failed to save course: ${errorMsg}. Make sure you are logged in and have permission (only instructor can edit their own).`);
            console.error('Error saving course:', err.response ? err.response.data : err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle deleting a course
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
            return;
        }
        setError('');
        try {
            await api.delete(`courses/${id}/`);
            fetchCourses(); // Refresh the list
            if (currentCourse && currentCourse.id === id) {
                // If the deleted course was being edited, clear the form
                setCurrentCourse(null);
                setFormTitle('');
                setFormDescription('');
                setFormPrice('');
                setFormDurationHours('');
                setFormCategory('');
            }
        } catch (err) {
            setError('Failed to delete course. You might not be the instructor or have permission.');
            console.error('Error deleting course:', err.response ? err.response.data : err.message);
        }
    };

    // --- IMPORTANT: Ensure 'courses' is an array before attempting to map ---
    // If loading, show a loading message.
    if (loading) return <div className="loading-message">Loading courses...</div>;

    // If there's a general error (e.g., failed to fetch), show it.
    if (error && !isSubmitting) return <div className="error-message">Error: {error}</div>;

    return (
        <div className="page-container">
            <h1>Manage Courses</h1>

            {/* Course Form (Create/Edit) */}
            {user && ( // Only show form if user is logged in
                <div className="form-container">
                    <h3>{currentCourse ? 'Edit Course' : 'Add New Course'}</h3>
                    {/* Error message specifically for the form */}
                    {error && isSubmitting && <p className="error-message">{error}</p>}
                    <form onSubmit={handleFormSubmit}>
                        <div>
                            <label htmlFor="course-title">Title:</label>
                            <input
                                type="text"
                                id="course-title"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <label htmlFor="course-description">Description:</label>
                            <textarea
                                id="course-description"
                                value={formDescription}
                                onChange={(e) => setFormDescription(e.target.value)}
                                rows="4"
                                required
                                disabled={isSubmitting}
                            ></textarea>
                        </div>
                        <div>
                            <label htmlFor="course-price">Price:</label>
                            <input
                                type="number"
                                id="course-price"
                                step="0.01"
                                value={formPrice}
                                onChange={(e) => setFormPrice(e.target.value)}
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <label htmlFor="course-duration">Duration (Hours):</label>
                            <input
                                type="number"
                                id="course-duration"
                                value={formDurationHours}
                                onChange={(e) => setFormDurationHours(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <label htmlFor="course-category">Category:</label>
                            <select
                                id="course-category"
                                value={formCategory}
                                onChange={(e) => setFormCategory(e.target.value)}
                                required
                                disabled={isSubmitting || categories.length === 0}
                            >
                                <option value="">Select a Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            {categories.length === 0 && <p className="small-warning">No categories available. Please add categories first!</p>}
                        </div>
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : (currentCourse ? 'Update Course' : 'Add Course')}
                        </button>
                        {currentCourse && (
                            <button type="button" onClick={() => {
                                setCurrentCourse(null); setFormTitle(''); setFormDescription('');
                                setFormPrice(''); setFormDurationHours(''); setFormCategory(''); setError('');
                            }} disabled={isSubmitting}>
                                Cancel
                            </button>
                        )}
                    </form>
                </div>
            )}

            {/* Course List */}
            <div className="list-container">
                <h3>Existing Courses</h3>
                {/* Ensure courses is an array and check its length */}
                {Array.isArray(courses) && courses.length === 0 && !loading && <p>No courses found. {user && 'Use the form above to add one.'}</p>}
                <ul>
                    {/* The crucial check to prevent .map() on non-array */}
                    {Array.isArray(courses) && courses.map(course => (
                        <li key={course.id}>
                            <h4>{course.title}</h4>
                            <p><strong>Category:</strong> {course.category_name || 'N/A'}</p>
                            <p><strong>Instructor:</strong> {course.instructor_username || 'N/A'}</p>
                            <p><strong>Price:</strong> ${parseFloat(course.price).toFixed(2)}</p>
                            <p>{course.description}</p>
                            <p className="meta-info">Duration: {course.duration_hours ? `${course.duration_hours} hours` : 'N/A'} | Created: {new Date(course.created_at).toLocaleDateString()}</p>
                            {user && user.id === course.instructor && ( // Only show edit/delete if current user is the instructor
                                <div className="actions">
                                    <button onClick={() => handleEditClick(course)} className="edit-button">Edit</button>
                                    <button onClick={() => handleDelete(course.id)} className="delete-button">Delete</button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default CoursePage;