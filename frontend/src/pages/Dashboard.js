import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [username, setUsername] = useState('');
  const [rooms, setRooms] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // Fetch user data and rooms on mount
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Fetch user info
        const userResponse = await axios.get('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsername(userResponse.data.username);

        // Fetch chat rooms
        const roomsResponse = await axios.get('http://localhost:5000/api/rooms', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRooms(roomsResponse.data);
        setIsLoaded(true);
      } catch (err) {
        setErrorMessage('Failed to load dashboard data. Please try again.');
        console.error('Dashboard fetch error:', err);
      }
    };

    fetchData();
  }, [navigate]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Navigate to chat room
  const handleJoinRoom = (roomId) => {
    navigate(`/chatroom/${roomId}`);
  };

  // Navigate to profile page
  const handleProfileRedirect = () => {
    navigate('/profile');
  };

  // Create new room (placeholder for now, could open a modal)
  const handleCreateRoom = () => {
    navigate('/create-room'); // Assuming a separate page or modal for room creation
  };

  return (
    <div className={`dashboard-page ${isLoaded ? 'loaded' : ''}`}>
      {/* Background Particles */}
      <div className="particles">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
      </div>

      {/* Header */}
      <header className="dashboard-header">
        <h1 className="brand-title">SafeChat</h1>
        <div className="user-controls">
          <span className="user-greeting">Welcome, {username || 'User'}!</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-wrapper">
        {/* Sidebar Navigation */}
        <nav className="dashboard-nav">
          <ul className="nav-list">
            <li className="nav-item active">Dashboard</li>
            <li className="nav-item" onClick={() => navigate('/chatrooms')}>
              Chat Rooms
            </li>
            <li className="nav-item" onClick={handleProfileRedirect}>
              Profile
            </li>
          </ul>
        </nav>

        {/* Main Dashboard Content */}
        <main className="dashboard-main">
          {errorMessage && <p className="error-message">{errorMessage}</p>}

          {/* Security Status */}
          <div className="security-status">
            <span className="security-icon">🔒</span>
            <p className="security-text">All Rooms End-to-End Encrypted</p>
          </div>

          {/* Active Chat Rooms */}
          <section className="rooms-section">
            <div className="section-header">
              <h2 className="section-title">Active Chat Rooms</h2>
              <button className="create-room-btn" onClick={handleCreateRoom}>
                Start New Chat
              </button>
            </div>
            <div className="rooms-grid">
              {rooms.length > 0 ? (
                rooms.map((room) => (
                  <div key={room.id} className="room-card">
                    <h3 className="room-name">{room.name || `Room #${room.id}`}</h3>
                    <p className="room-participants">
                      Participants: {room.participants.join(', ')}
                    </p>
                    <p className="room-last-message">
                      Last: {room.lastMessage || 'No messages yet'}
                    </p>
                    <p className="room-expiry">
                      Expires in {room.daysUntilExpiry || 7} days
                    </p>
                    <button
                      className="join-room-btn"
                      onClick={() => handleJoinRoom(room.id)}
                    >
                      Join Room
                    </button>
                  </div>
                ))
              ) : (
                <p className="no-rooms-text">No active rooms yet. Create one!</p>
              )}
            </div>
          </section>

          {/* Recent Activity */}
          <section className="activity-section">
            <h2 className="section-title">Recent Activity</h2>
            <div className="activity-list">
              {rooms.length > 0 ? (
                rooms.slice(0, 3).map((room) => (
                  <div key={room.id} className="activity-item">
                    <p className="activity-text">
                      {room.lastMessage
                        ? `${room.participants[1] || 'Someone'} sent a message in ${
                            room.name || `Room #${room.id}`
                          }`
                        : `No recent activity in ${room.name || `Room #${room.id}`}`}
                    </p>
                    <span className="activity-timestamp">
                      {room.lastMessageTime || 'N/A'}
                    </span>
                  </div>
                ))
              ) : (
                <p className="no-activity-text">No recent activity.</p>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p className="footer-text">Built for the future. Secured for today.</p>
        <p className="version-text">v1.0</p>
      </footer>
    </div>
  );
};

export default Dashboard;