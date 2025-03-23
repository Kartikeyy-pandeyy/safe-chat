import React from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import './NoticePopup.css';

const NoticePopup = ({ onClose }) => {
  // Particle initialization
  const particlesInit = async (engine) => {
    await loadSlim(engine);
  };

  // Particle options
  const particlesOptions = {
    particles: {
      number: {
        value: 80,
        density: {
          enable: true,
          value_area: 800,
        },
      },
      color: {
        value: '#ffffff', // Bright white stars
      },
      shape: {
        type: 'star',
      },
      opacity: {
        value: 0.8,
        random: true,
      },
      size: {
        value: 4,
        random: true,
      },
      move: {
        enable: true,
        speed: 0.8,
        direction: 'none',
        random: true,
        straight: false,
        out_mode: 'out',
        bounce: false,
      },
    },
    interactivity: {
      events: {
        onhover: { enable: false },
        onclick: { enable: false },
      },
    },
  };

  return (
    <div className="notice-popup-overlay">
      <div className="notice-popup-content">
        {/* Particles Background */}
        <Particles
          id="notice-particles"
          init={particlesInit}
          options={particlesOptions}
          className="notice-particles"
        />
        <button className="notice-close-btn" onClick={onClose}>
          ×
        </button>
        <h3 className="notice-popup-title">Important Notice</h3>
        <div className="notice-popup-body">
          <p className="notice-popup-message">
            Thanks for your patience! Our backend is hosted on Render.com’s free tier, which powers down when idle. It may take around <span className="highlight">50-60 seconds</span> to start up again. We appreciate your understanding.
          </p>
          <p className="notice-popup-message">
            <span className="highlight">Face Login Tip:</span> For the best experience, we recommend using a smartphone in a well-lit area. Smartphone cameras tend to offer better image quality, ensuring smoother recognition.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoticePopup;
