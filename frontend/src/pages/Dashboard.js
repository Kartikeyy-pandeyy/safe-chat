import React, { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const API_BASE_URL = 'https://safe-chat-7uuh.onrender.com/api';

  // Fetch user's rooms on mount
  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await axios.get(`${API_BASE_URL}/chatrooms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRooms(response.data || []); // Ensure array if response is empty
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setErrorMessage(err.response?.data?.message || 'Failed to load rooms.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [navigate]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleCreateRoom = async () => {
    if (rooms.length >= 5) {
      setErrorMessage('Max 5 rooms allowed.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/chatrooms/create`,
        { roomName: roomName || `Room-${Date.now()}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { room, roomCode } = response.data;
      setRooms([...rooms, room]);
      setRoomCode(roomCode);
      setShowCodePopup(true);
      setRoomName('');
      setSuccessMessage('Room created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (rooms.length >= 5) {
      setErrorMessage('Max 5 rooms allowed.');
      return;
    }
    const sanitizedCode = joinCode.replace(/[^a-zA-Z0-9]/g, '');
    if (sanitizedCode.length < 5 || sanitizedCode.length > 10) {
      setErrorMessage('Code must be 5-10 characters.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/chatrooms/join`,
        { roomCode: sanitizedCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { room } = response.data;
      if (room.participants.length >= 3) {
        setErrorMessage('Room is full (max 3 participants).');
        return;
      }
      setRooms([...rooms, room]);
      setJoinCode('');
      setSuccessMessage('Room joined successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Invalid room code.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = async (roomId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/chatrooms/leave`,
        { roomId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRooms(rooms.filter((room) => room._id !== roomId));
      setSuccessMessage(response.data.message || 'Left room successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to leave room.');
    } finally {
      setLoading(false);
    }
  };

  const goToChat = (roomId) => navigate(`/chat/${roomId}`);

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
          <h1>Dashboard</h1>
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

        <section className="room-management">
          <div className="room-actions">
            <div className="create-form">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room Name (optional)"
                className="input-field"
                aria-label="Room Name"
              />
              <button className="action-btn create-btn" onClick={handleCreateRoom}>
                Create Room
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
              />
              <button type="submit" className="action-btn join-btn">Join Room</button>
            </form>
          </div>

          <h2>Your Talk Rooms ({rooms.length}/5)</h2>
          <p className="room-note">Messages stored for 7 days</p>
          <div className="room-grid">
            {rooms.length > 0 ? (
              rooms.map((room) => (
                <div key={room._id} className="room-card" onClick={() => goToChat(room._id)}>
                  <div className="room-info">
                    <h3>{room.roomName}</h3>
                    <p>Participants: {room.participants.length}/3</p>
                  </div>
                  <div className="room-actions">
                    <span className="chat-arrow">➔</span>
                    <button
                      className="leave-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeaveRoom(room._id);
                      }}
                    >
                      Leave
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
        <button className="nav-btn" onClick={() => navigate('/dashboard')}>🏠</button>
        <button className="nav-btn" onClick={() => navigate('/profile')}>👤</button>
        <button className="nav-btn" onClick={handleLogout}>🚪</button>
      </div>

      {showCodePopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Room Created!</h3>
            <p>Share this code:</p>
            <div className="code-display">{roomCode}</div>
            <button
              className="action-btn"
              onClick={() => {
                navigator.clipboard.writeText(roomCode);
                setShowCodePopup(false);
              }}
            >
              Copy & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;