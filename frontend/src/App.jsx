import React, { useState } from 'react';
import CastleScene from './components/CastleScene';
import LoginForm from './components/LoginForm';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userLevel, setUserLevel] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [hoverState, setHoverState] = useState('idle');

  const handleLoginSuccess = (level, name, role) => {
    setIsAuthenticated(true);
    setUserLevel(level);
    setUserName(name);
    setUserRole(role);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 3D Background */}
      <CastleScene isFocused={isFocused} />

      {/* Login / Dashboard Overlay */}
      {!isAuthenticated && (
        <LoginForm
          onLogin={handleLoginSuccess}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      )}

      {isAuthenticated && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10
        }}>
          <div className="glass-panel" style={{
            pointerEvents: 'auto',
            padding: '2.5rem',
            textAlign: 'center',
            maxWidth: '500px'
          }}>
            <h2 style={{ color: '#FFD700', marginBottom: '1rem', fontFamily: "'Cinzel', serif" }}>
              {userRole === 'Admin' ? '👑 Queen/King Admin' : '🏰 Realm Ruler'} {userName}
            </h2>
            <h3 style={{ margin: 0, color: '#4CAF50' }}>Personalized Learning Platform</h3>
            <p style={{ color: '#ccc', marginTop: '0.5rem' }}>
              Your Path: {userLevel === 'All' ? '🌟 All Kingdoms (Admin Access)' : (userLevel || 'Kingdom Beginner')}
            </p>

            {/* Admin sees BOTH kingdoms */}
            {userRole === 'Admin' && (
              <>
                <div style={{ background: 'rgba(76,175,80,0.15)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(76,175,80,0.3)', marginTop: '1rem' }}>
                  <h4 style={{ color: '#4CAF50', margin: '0 0 0.5rem 0' }}>👑 Kingdom Beginner</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>Access all beginner course modules and build your Coding Village.</p>
                  <button
                    className="action-btn"
                    onMouseEnter={() => setHoverState('thinking')}
                    onMouseLeave={() => setHoverState('idle')}
                    style={{ marginTop: '0.8rem', padding: '0.6rem 1.2rem', background: 'linear-gradient(45deg, #4CAF50, #2E7D32)', color: '#fff' }}
                  >
                    Enter Beginner Kingdom
                  </button>
                </div>
                <div style={{ background: 'rgba(255,152,0,0.15)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,152,0,0.3)', marginTop: '1rem' }}>
                  <h4 style={{ color: '#ff9800', margin: '0 0 0.5rem 0' }}>⚔️ Kingdom Warrior</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>Take the 10-question assessment and expand your Coding Empire!</p>
                  <button
                    className="action-btn"
                    onMouseEnter={() => setHoverState('drawingSword')}
                    onMouseLeave={() => setHoverState('idle')}
                    style={{ marginTop: '0.8rem', padding: '0.6rem 1.2rem', background: 'linear-gradient(45deg, #FFC107, #FF9800)', color: '#fff' }}
                  >
                    Trigger Assessment
                  </button>
                </div>
              </>
            )}

            {/* Regular user: Kingdom Warrior only */}
            {userRole !== 'Admin' && userLevel === 'Kingdom Warrior' && (
              <div style={{ background: 'rgba(255,152,0,0.15)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,152,0,0.3)', marginTop: '1rem' }}>
                <h4 style={{ color: '#ff9800', margin: '0 0 0.5rem 0' }}>⚔️ Assessment Required</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>Prepare for your 10-question evaluation to determine your true rank!</p>
                <button
                  className="action-btn"
                  onMouseEnter={() => setHoverState('thinking')}
                  onMouseLeave={() => setHoverState('idle')}
                  style={{ marginTop: '0.8rem', padding: '0.6rem 1.2rem', background: 'linear-gradient(45deg, #FFC107, #FF9800)', color: '#fff' }}
                >
                  Trigger Assessment
                </button>
              </div>
            )}

            <button
              className="action-btn"
              onClick={() => { setIsAuthenticated(false); setUserLevel(null); setUserRole(null); }}
              style={{
                marginTop: '1.5rem',
                padding: '0.8rem 2rem',
                background: 'linear-gradient(45deg, #C62828, #B71C1C)',
                color: '#fff'
              }}
            >
              Logout / Exit Realm
            </button>
          </div>
        </div>
      )}

      {isAuthenticated && (
        <div className="floating-dock">
          <div className="dock-icon" title="Warrior Quests" onMouseEnter={() => setHoverState('drawingSword')} onMouseLeave={() => setHoverState('idle')}>⚔️</div>
          <div className="dock-icon" title="Spellbooks (Courses)" onMouseEnter={() => setHoverState('thinking')} onMouseLeave={() => setHoverState('idle')}>📖</div>
          <div className="dock-icon" title="Empire Details">👑</div>
          <div className="dock-icon" title="Guild Chat">🦅</div>
        </div>
      )}
    </div>
  );
}

export default App;
