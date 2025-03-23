import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import '../styles/ChatRoom.css';

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomName, setRoomName] = useState('');
  const [participants, setParticipants] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { roomId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const API_BASE_URL = 'https://safe-chat-7uuh.onrender.com/api';
  const SOCKET_URL = 'https://safe-chat-7uuh.onrender.com';

  // Retrieve token once at the top of the component
  const token = localStorage.getItem('token');

  // Initialize WebSocket connection
  useEffect(() => {
    if (!token || !roomId) {
      navigate('/login');
      return;
    }

    // Connect to WebSocket
    socketRef.current = io(SOCKET_URL, {
      auth: { token: `Bearer ${token}` },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Join the room
    socketRef.current.emit('joinRoom', roomId);

    // Listen for new messages
    socketRef.current.on('newMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Handle WebSocket errors
    socketRef.current.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
      setErrorMessage('Failed to connect to chat server. Please try again.');
    });

    // Handle custom error events from the server
    socketRef.current.on('error', (error) => {
      console.error('WebSocket server error:', error);
      setErrorMessage(error);
      if (error.includes('Authentication error')) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
      }
    });

    // Cleanup on unmount
    return () => {
      socketRef.current.disconnect();
    };
  }, [roomId, navigate, token]);

  // Fetch initial room data
  useEffect(() => {
    const fetchRoomData = async () => {
      if (!token || !roomId) {
        navigate('/login');
        return;
      }

      setLoading(true);
      try {
        // Fetch messages
        const messagesResponse = await axios.get(
          `${API_BASE_URL}/chatrooms/${roomId}/messages`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMessages(messagesResponse.data);

        // Fetch room details
        const roomResponse = await axios.get(
          `${API_BASE_URL}/chatrooms/${roomId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setRoomName(roomResponse.data.roomName);
        setParticipants(roomResponse.data.participants);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          navigate('/login');
        } else {
          setErrorMessage(
            err.response?.data?.message || 'Failed to load chat room.'
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId, navigate, token]);

  // Scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId || !token) return;

    setLoading(true);
    try {
      const sender = {
        _id: localStorage.getItem('userId') || '',
        username: localStorage.getItem('username') || 'Unknown',
      };
      const messageData = { roomId, content: newMessage, sender };

      // Emit the message via WebSocket
      socketRef.current.emit('sendMessage', messageData);

      setNewMessage('');
      setSuccessMessage('Message sent!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage('Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId || !token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/chatrooms/leave`,
        { roomId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Emit leaveRoom event via WebSocket
      socketRef.current.emit('leaveRoom', roomId);

      setSuccessMessage('Left room successfully!');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to leave room.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const dismissMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <div className="chatroom-page">
      <div className="particles">
        <span className="particle particle-1"></span>
        <span className="particle particle-2"></span>
        <span className="particle particle-3"></span>
        <span className="particle particle-4"></span>
      </div>

      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>SafeChat</h2>
          <button
            className="close-btn"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>
        <nav>
          <button
            className="nav-btn"
            onClick={() => navigate('/dashboard')}
            aria-label="Go to Dashboard"
          >
            Dashboard
          </button>
          <button
            className="nav-btn"
            onClick={() => navigate('/profile')}
            aria-label="Go to Profile"
          >
            Profile
          </button>
          <button
            className="nav-btn"
            onClick={handleLogout}
            aria-label="Logout"
          >
            Logout
          </button>
        </nav>
      </div>

      <div className="main-content">
        <header>
          <button
            className="menu-btn"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <h1>{roomName || 'Chat Room'}</h1>
          <div className="room-info">
            <span>Participants: {participants.length}/3</span>
            <button
              className="leave-btn"
              onClick={handleLeaveRoom}
              aria-label="Leave room"
            >
              Leave
            </button>
          </div>
        </header>

        {loading && <div className="loader"></div>}
        {(errorMessage || successMessage) && (
          <div className="message-container">
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {successMessage && (
              <p className="success-message">{successMessage}</p>
            )}
            <button
              className="dismiss-btn"
              onClick={dismissMessages}
              aria-label="Dismiss messages"
            >
              ×
            </button>
          </div>
        )}

        <div className="messages-container">
          {messages.length > 0 ? (
            messages.map((msg, index) => (
              <div
                key={msg._id || index} // Use _id if available, otherwise fallback to index
                className={`message ${
                  msg.sender._id === localStorage.getItem('userId')
                    ? 'sent'
                    : 'received'
                }`}
              >
                <div className="message-header">
                  <span className="sender">{msg.sender.username}</span>
                  <span className="timestamp">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="content">{msg.content}</p>
              </div>
            ))
          ) : (
            <p className="no-messages">No messages yet. Start chatting!</p>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="message-form">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="message-input"
            aria-label="Message input"
            disabled={loading}
          />
          <button
            type="submit"
            className="send-btn"
            disabled={loading}
            aria-label="Send message"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>

      <div className="bottom-nav">
        <button
          className="nav-btn"
          onClick={() => navigate('/dashboard')}
          aria-label="Go to Dashboard"
        >
          🏠
        </button>
        <button
          className="nav-btn"
          onClick={() => navigate('/profile')}
          aria-label="Go to Profile"
        >
          👤
        </button>
        <button
          className="nav-btn"
          onClick={handleLogout}
          aria-label="Logout"
        >
          🚪
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;