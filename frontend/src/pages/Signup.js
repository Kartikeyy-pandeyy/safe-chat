import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Signup.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [image, setImage] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [countdown, setCountdown] = useState(3); // Countdown starts at 3 seconds
  const navigate = useNavigate();

  // Trigger animations on component mount
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Handle countdown and redirect after popup
  useEffect(() => {
    if (showPopup) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/login'); // Redirect to login when countdown reaches 0
            return 0;
          }
          return prev - 1;
        });
      }, 1000); // Update every second

      return () => clearInterval(timer); // Cleanup on unmount or when popup closes
    }
  }, [showPopup, navigate]);

  // Handle face capture using WebRTC
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
          setErrorMessage(''); // Clear any previous errors
          console.log('Captured image Blob:', blob); // Debug the captured image
        }, 'image/jpeg'); // Explicitly set to JPEG format
        stream.getTracks().forEach((track) => track.stop());
      }, 2000);
    } catch (err) {
      console.error('Camera access denied:', err);
      setErrorMessage('Camera access denied. Please allow access to continue.');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(''); // Reset error message

    if (!image) {
      setErrorMessage('Please capture your face to sign up.');
      return;
    }

    const formData = new FormData();
    formData.append('email', email);
    formData.append('username', username);
    formData.append('password', password);
    formData.append('image', image, 'face.jpg'); // Add filename for clarity

    // Log FormData contents for debugging (note: FormData logging is tricky, use this workaround)
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      const response = await axios.post('http://localhost:5000/api/users/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      localStorage.setItem('token', response.data.token);
      setShowPopup(true); // Show popup on successful signup
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Signup failed. Please try again.';
      setErrorMessage(errorMsg);
      console.error('Signup error:', err);
      if (err.response) {
        console.error('Server response:', err.response.data); // Log detailed server response
      }
    }
  };

  // Navigate back to login page
  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <div className={`signup-page ${isLoaded ? 'loaded' : ''}`}>
      {/* Background Particles */}
      <div className="particles">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
      </div>

      {/* Main Content */}
      <div className="signup-wrapper">
        <h1 className="brand-title">SafeChat</h1>
        <div className="signup-box">
          <h2 className="signup-title">Create Your Account</h2>
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <form onSubmit={handleSubmit} className="signup-form">
            <div className="input-group">
              <label htmlFor="email" className="input-label">
                Email Address
              </label>
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

            <div className="input-group">
              <label htmlFor="username" className="input-label">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="input-field"
                autoComplete="username"
              />
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                autoComplete="new-password"
              />
            </div>

            <div className="input-group">
              <button
                type="button"
                onClick={handleCapture}
                className="action-btn face-btn"
              >
                {image ? (
                  <span className="success-text">Face Captured ✓</span>
                ) : (
                  'Capture Your Face'
                )}
              </button>
            </div>

            <button type="submit" className="action-btn submit-btn">
              Sign Up
            </button>

            <div className="login-container">
              <span className="login-text">
                Already have an account?{' '}
                <span className="login-link" onClick={handleLoginRedirect}>
                  Log in here
                </span>
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* Popup */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3 className="popup-title">Welcome to SAFECHAT</h3>
            <p className="popup-message">
              Redirecting to login page in {countdown}...
            </p>
          </div>
        </div>
      )}

      {/* Footer Note */}
      <div className="footer-note">
        <p>Built for the future. Secured for today.</p>
      </div>
    </div>
  );
};

export default Signup;