import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showCodePopup, setShowCodePopup] = useState(false);
  const [loading, setLoading] = useState({ fetch: false, create: false, join: false, leave: {} });
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(null); // Room ID for confirmation
  const [username, setUsername] = useState(localStorage.getItem('username') || 'User'); // State for username
  const navigate = useNavigate();
  const API_BASE_URL = 'https://safe-chat-7uuh.onrender.com/api';
  const MAX_ROOMS = 5;
  const MIN_ROOM_NAME_LENGTH = 3;

  // Fetch user profile to get username
  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedUsername = response.data.username;
      setUsername(fetchedUsername);
      localStorage.setItem('username', fetchedUsername); // Update localStorage
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
      } else {
        setErrorMessage(err.response?.data?.message || 'Failed to load user profile.');
      }
    }
  }, [navigate]);

  // Fetch rooms with debounced callback
  const fetchRooms = useCallback(async () => {
    setLoading((prev) => ({ ...prev, fetch: true }));
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await axios.get(`${API_BASE_URL}/chatrooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(response.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
      } else {
        setErrorMessage(err.response?.data?.message || 'Failed to load rooms.');
      }
    } finally {
      setLoading((prev) => ({ ...prev, fetch: false }));
    }
  }, [navigate]);

  useEffect(() => {
    // Fetch user profile if username is not in localStorage or is 'User'
    if (!localStorage.getItem('username') || localStorage.getItem('username') === 'User') {
      fetchUserProfile();
    }
    fetchRooms();
  }, [fetchRooms, fetchUserProfile]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const handleCreateRoom = async () => {
    if (roomName && roomName.length < MIN_ROOM_NAME_LENGTH) {
      setErrorMessage(`Room name must be at least ${MIN_ROOM_NAME_LENGTH} characters.`);
      return;
    }
    setLoading((prev) => ({ ...prev, create: true }));
    setErrorMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/chatrooms/create`,
        { roomName: roomName || `Room-${Date.now()}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { roomId, roomCode } = response.data;
      setRoomCode(roomCode);
      setShowCodePopup(true);
      setRoomName('');
      setSuccessMessage('Room created successfully!');
      fetchRooms(); // Refetch to ensure sync
      setTimeout(() => {
        setShowCodePopup(false); // Close popup before navigating
        navigate(`/chat/${roomId}`); // Navigate to the new room
      }, 2000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to create room.');
    } finally {
      setLoading((prev) => ({ ...prev, create: false }));
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    const sanitizedCode = joinCode.trim().toUpperCase();
    if (sanitizedCode.length < 5 || sanitizedCode.length > 10) {
      setErrorMessage('Room code must be 5-10 characters.');
      return;
    }
    setLoading((prev) => ({ ...prev, join: true }));
    setErrorMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/chatrooms/join`,
        { roomCode: sanitizedCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { roomId } = response.data;
      setJoinCode('');
      setSuccessMessage('Room joined successfully!');
      fetchRooms(); // Refetch to ensure sync
      setTimeout(() => navigate(`/chat/${roomId}`), 1000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Invalid room code.');
    } finally {
      setLoading((prev) => ({ ...prev, join: false }));
    }
  };

  const handleLeaveRoom = async (roomId) => {
    setLoading((prev) => ({ ...prev, leave: { ...prev.leave, [roomId]: true } }));
    setErrorMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/chatrooms/leave`,
        { roomId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage(response.data.message || 'Left room successfully!');
      fetchRooms(); // Refetch to ensure sync
      setShowLeaveConfirm(null);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to leave room.');
    } finally {
      setLoading((prev) => ({ ...prev, leave: { ...prev.leave, [roomId]: false } }));
    }
  };

  const goToChat = (roomId) => navigate(`/chat/${roomId}`);

  const copyRoomCode = (code) => {
    navigator.clipboard.writeText(code);
    setSuccessMessage('Room code copied!');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const dismissMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <div className="dashboard-page">
      <div className="particles">
        <span className="particle particle-1"></span>
        <span className="particle particle-2"></span>
        <span className="particle particle-3"></span>
        <span className="particle particle-4"></span>
      </div>

      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>SafeChat</h2>
          <button className="close-btn" onClick={toggleSidebar} aria-label="Close sidebar">
            ×
          </button>
        </div>
        <nav>
          <button className="nav-btn" onClick={() => navigate('/dashboard')} aria-label="Go to Dashboard">
            Dashboard
          </button>
          <button className="nav-btn" onClick={() => navigate('/profile')} aria-label="Go to Profile">
            Profile
          </button>
          <button className="nav-btn" onClick={handleLogout} aria-label="Logout">
            Logout
          </button>
        </nav>
      </div>

      <div className="main-content">
        <header>
          <button className="menu-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
            ☰
          </button>
          <h1>Dashboard</h1>
          <div className="user-info">
            <span>{username}</span>
          </div>
        </header>

        {(errorMessage || successMessage) && (
          <div className="message-container">
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
            <button className="dismiss-btn" onClick={dismissMessages} aria-label="Dismiss messages">
              ×
            </button>
          </div>
        )}

        <section className="room-management">
          <div className="room-actions-container">
            <div className="forms-container">
              <div className="create-form">
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Name (optional)"
                  className="input-field"
                  aria-label="Room Name"
                  disabled={loading.create}
                />
                <button
                  className="action-btn create-btn"
                  onClick={handleCreateRoom}
                  disabled={loading.create || rooms.length >= MAX_ROOMS}
                  aria-label="Create Room"
                >
                  {loading.create ? 'Creating...' : 'Create Room'}
                </button>
              </div>
              <form className="join-form" onSubmit={handleJoinRoom}>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter Room Code"
                  className="input-field"
                  aria-label="Room Code"
                  required
                  disabled={loading.join}
                />
                <button
                  type="submit"
                  className="action-btn join-btn"
                  disabled={loading.join || rooms.length >= MAX_ROOMS}
                  aria-label="Join Room"
                >
                  {loading.join ? 'Joining...' : 'Join Room'}
                </button>
              </form>
            </div>
            <div className="refresh-container">
              <button
                className="action-btn refresh-btn"
                onClick={fetchRooms}
                disabled={loading.fetch}
                aria-label="Refresh Rooms"
              >
                {loading.fetch ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          <h2>Your Talk Rooms ({rooms.length}/{MAX_ROOMS})</h2>
          <p className="room-note">Messages stored for 7 days</p>
          <div className="room-grid">
            {rooms.length > 0 ? (
              rooms
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort by newest first
                .map((room) => (
                  <div key={room._id} className="room-card" onClick={() => goToChat(room._id)}>
                    <div className="room-info">
                      <h3>{room.roomName}</h3>
                      <p>Participants: {room.participants.length}/3</p>
                      <p className="room-code">Code: {room.roomCode}</p>
                    </div>
                    <div className="room-actions">
                      <button
                        className="copy-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyRoomCode(room.roomCode);
                        }}
                        aria-label={`Copy room code ${room.roomCode}`}
                      >
                        📋
                      </button>
                      <span className="chat-arrow">➔</span>
                      <button
                        className="leave-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowLeaveConfirm(room._id);
                        }}
                        disabled={loading.leave[room._id]}
                        aria-label={`Leave room ${room.roomName}`}
                      >
                        {loading.leave[room._id] ? 'Leaving...' : 'Leave'}
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="no-rooms-card">
                <p>No rooms yet. Create or join one!</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="bottom-nav">
        <button className="nav-btn" onClick={() => navigate('/dashboard')} aria-label="Go to Dashboard">
          🏠
        </button>
        <button className="nav-btn" onClick={() => navigate('/profile')} aria-label="Go to Profile">
          👤
        </button>
        <button className="nav-btn" onClick={handleLogout} aria-label="Logout">
          🚪
        </button>
      </div>

      {showCodePopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Room Created!</h3>
            <p>Share this code:</p>
            <div className="code-display">{roomCode}</div>
            <div className="popup-buttons">
              <button
                className="action-btn"
                onClick={() => {
                  navigator.clipboard.writeText(roomCode);
                  setSuccessMessage('Room code copied!');
                }}
                aria-label="Copy room code and close"
              >
                Copy & Close
              </button>
              <button
                className="action-btn close-btn"
                onClick={() => setShowCodePopup(false)}
                aria-label="Close popup"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeaveConfirm && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Leave Room?</h3>
            <p>Are you sure you want to leave "{rooms.find((r) => r._id === showLeaveConfirm)?.roomName}"?</p>
            <div className="popup-buttons">
              <button
                className="action-btn"
                onClick={() => handleLeaveRoom(showLeaveConfirm)}
                aria-label="Confirm leave room"
              >
                Yes
              </button>
              <button
                className="action-btn close-btn"
                onClick={() => setShowLeaveConfirm(null)}
                aria-label="Cancel leave room"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;