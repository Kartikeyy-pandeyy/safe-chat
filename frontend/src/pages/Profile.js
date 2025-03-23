import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Profile.css';

const Profile = () => {
  const [username, setUsername] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
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
        if (response.data.imageUrl) setPreview(response.data.imageUrl);
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
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
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
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <header>
        <h1>Profile</h1>
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
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label>Face Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} className="file-input" />
          {preview && <img src={preview} alt="Preview" className="image-preview" />}
        </div>
        <button type="submit" className="action-btn">Update Profile</button>
      </form>
      <button className="back-btn" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
    </div>
  );
};

export default Profile;