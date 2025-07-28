import React, { useState } from 'react';

interface MobileNavigationProps {
  showTasks: boolean;
  showStats: boolean;
  showSettings: boolean;
  onToggleTasks: () => void;
  onToggleStats: () => void;
  onToggleSettings: () => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  showTasks,
  showStats,
  showSettings,
  onToggleTasks,
  onToggleStats,
  onToggleSettings
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsMenuOpen(false); // Close menu after selection
  };

  return (
    <div className="mobile-navigation">
      <button 
        className={`menu-toggle ${isMenuOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-label="切換選單"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)} />
        <nav className="mobile-menu-content">
          <div className="mobile-menu-header">
            <h3>選單</h3>
            <button 
              className="close-menu-btn"
              onClick={() => setIsMenuOpen(false)}
              aria-label="關閉選單"
            >
              ✕
            </button>
          </div>
          
          <ul className="mobile-menu-items">
            <li>
              <button
                className={`mobile-menu-item ${showTasks ? 'active' : ''}`}
                onClick={() => handleMenuItemClick(onToggleTasks)}
              >
                <span className="menu-icon">📋</span>
                <span className="menu-text">任務管理</span>
                {showTasks && <span className="active-indicator">●</span>}
              </button>
            </li>
            
            <li>
              <button
                className={`mobile-menu-item ${showStats ? 'active' : ''}`}
                onClick={() => handleMenuItemClick(onToggleStats)}
              >
                <span className="menu-icon">📊</span>
                <span className="menu-text">統計數據</span>
                {showStats && <span className="active-indicator">●</span>}
              </button>
            </li>
            
            <li>
              <button
                className={`mobile-menu-item ${showSettings ? 'active' : ''}`}
                onClick={() => handleMenuItemClick(onToggleSettings)}
              >
                <span className="menu-icon">⚙️</span>
                <span className="menu-text">設定</span>
                {showSettings && <span className="active-indicator">●</span>}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default MobileNavigation;