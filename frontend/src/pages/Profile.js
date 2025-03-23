import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Profile.css';

const Profile = () => {
  const [username, setUsername] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const API_BASE_URL = 'https://safe-chat-7uuh.onrender.com/api';

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsername(response.data.username);
        setPreview(response.data.faceId ? `${API_BASE_URL}/users/image/${response.data._id}` : ''); // Assuming backend serves image
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setErrorMessage(err.response?.data?.message || 'Failed to load profile.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setErrorMessage('Image size must be less than 10MB.');
        return;
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Username cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('username', username);
      if (image) formData.append('image', image);

      const response = await axios.put(`${API_BASE_URL}/users/update`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      localStorage.setItem('username', response.data.username);
      setSuccessMessage('Profile updated successfully!');
      setImage(null); // Reset image after upload
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="profile-page">
      <div className="particles">
        <span className="particle particle-1"></span>
        <span className="particle particle-2"></span>
        <span className="particle particle-3"></span>
        <span className="particle particle-4"></span>
      </div>

      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>SafeChat</h2>
          <button className="close-btn" onClick={toggleSidebar}>×</button>
        </div>
        <nav>
          <button className="nav-btn" onClick={() => navigate('/dashboard')}>Dashboard</button>
          <button className="nav-btn" onClick={() => navigate('/profile')}>Profile</button>
          <button className="nav-btn" onClick={handleLogout}>Logout</button>
        </nav>
      </div>

      <div className="main-content">
        <header>
          <button className="menu-btn" onClick={toggleSidebar}>☰</button>
          <h1>Profile</h1>
          <div className="user-info">
            <span>{localStorage.getItem('username') || 'User'}</span>
          </div>
        </header>

        {loading && <div className="loader"></div>}
        {(errorMessage || successMessage) && (
          <div className="message-container">
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
          </div>
        )}

        <form onSubmit={handleUpdate} className="profile-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="Enter username"
              aria-label="Username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="face-image">Face Image</label>
            <input
              id="face-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input"
              aria-label="Upload face image"
            />
            {preview && (
              <div className="image-preview-container">
                <img src={preview} alt="Preview" className="image-preview" />
              </div>
            )}
          </div>
          <button type="submit" className="action-btn" disabled={loading}>
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>

        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Profile;