import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NoticePopup from '../components/NoticePopup'; // Import the new component
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [image, setImage] = useState(null);
  const [useFaceLogin, setUseFaceLogin] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false); // State for popup visibility
  const navigate = useNavigate();

  // Trigger animations and popup delay on component mount
  useEffect(() => {
    setIsLoaded(true);
    // Show popup after 1 second
    const popupTimer = setTimeout(() => {
      setShowPopup(true);
    }, 1000);
    // Cleanup timeout if component unmounts
    return () => clearTimeout(popupTimer);
  }, []);

  const handleCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;

      setTimeout(() => {
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, 640, 480);
        canvas.toBlob((blob) => {
          setImage(blob);
          setErrorMessage('');
        });
        stream.getTracks().forEach((track) => track.stop());
      }, 2000);
    } catch (err) {
      console.error('Camera access denied:', err);
      setErrorMessage('Camera access denied. Please allow access or use password login.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const formData = new FormData();
    formData.append('email', email);

    if (useFaceLogin) {
      if (!image) {
        setErrorMessage('Please capture your face before logging in.');
        return;
      }
      formData.append('image', image);
    } else {
      if (!password) {
        setErrorMessage('Please enter your password.');
        return;
      }
      formData.append('password', password);
    }

    try {
      const response = await axios.post('https://safe-chat-7uuh.onrender.com/api/users/login', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Login failed. Please try again.';
      setErrorMessage(errorMsg);
      console.error('Login error:', err);
    }
  };

  const handleSignupRedirect = () => {
    navigate('/signup');
  };

  return (
    <div className={`login-page ${isLoaded ? 'loaded' : ''}`}>
      <div className="particles">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
      </div>

      <div className="login-wrapper">
        <div className="intro-section">
          <h1 className="brand-title">SafeChat</h1>
          <p className="brand-tagline">Where Privacy Meets Innovation</p>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <h3>Encrypted Rooms</h3>
              <p>Your conversations stay private with end-to-end encryption.</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">👤</span>
              <h3>Facial Auth</h3>
              <p>Login securely with cutting-edge facial recognition.</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⏳</span>
              <h3>Ephemeral Chats</h3>
              <p>Messages vanish after 7 days for ultimate discretion.</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">👥</span>
              <h3>Intimate Groups</h3>
              <p>Connect closely with a max of 3 users per room.</p>
            </div>
          </div>
        </div>

        <div className="login-section">
          <div className="login-box">
            <h2 className="login-title">Access Your Sanctuary</h2>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <form onSubmit={handleSubmit} className="login-form">
              <div className="input-group">
                <label htmlFor="email" className="input-label">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field"
                  autoComplete="email"
                />
              </div>

              {useFaceLogin ? (
                <div className="input-group">
                  <button
                    type="button"
                    onClick={handleCapture}
                    className="login-action-btn login-face-btn"
                  >
                    {image ? (
                      <span className="success-text">Face Captured ✓</span>
                    ) : (
                      'Scan Your Face'
                    )}
                  </button>
                </div>
              ) : (
                <div className="input-group">
                  <label htmlFor="password" className="input-label">Password</label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-field"
                    autoComplete="current-password"
                  />
                </div>
              )}

              <button type="submit" className="login-action-btn login-submit-btn">
                {useFaceLogin ? 'Enter with Face' : 'Enter with Password'}
              </button>

              <div className="toggle-container">
                <span
                  className="toggle-text"
                  onClick={() => setUseFaceLogin(!useFaceLogin)}
                >
                  {useFaceLogin
                    ? 'Switch to Password Login'
                    : 'Switch to Face Login'}
                </span>
              </div>

              <div className="signup-container">
                <span className="signup-text">
                  New to SafeChat?{' '}
                  <span className="signup-link" onClick={handleSignupRedirect}>
                    Create new account
                  </span>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Add the NoticePopup component */}
      {showPopup && <NoticePopup onClose={() => setShowPopup(false)} />}

      <div className="footer-note">
        <p>Built for the future. Secured for today.</p>
      </div>
    </div>
  );
};

export default Login;