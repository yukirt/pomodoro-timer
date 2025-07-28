import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MobileNavigation from './MobileNavigation';

describe('MobileNavigation', () => {
  const mockProps = {
    showTasks: false,
    showStats: false,
    showSettings: false,
    onToggleTasks: vi.fn(),
    onToggleStats: vi.fn(),
    onToggleSettings: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render menu toggle button', () => {
    render(<MobileNavigation {...mockProps} />);
    
    const menuToggle = screen.getByLabelText('切換選單');
    expect(menuToggle).toBeInTheDocument();
    expect(menuToggle).toHaveClass('menu-toggle');
  });

  it('should toggle menu when menu button is clicked', () => {
    render(<MobileNavigation {...mockProps} />);
    
    const menuToggle = screen.getByLabelText('切換選單');
    
    // Initially menu should be closed
    expect(menuToggle).not.toHaveClass('active');
    
    // Click to open menu
    fireEvent.click(menuToggle);
    expect(menuToggle).toHaveClass('active');
    
    // Menu content should be visible
    expect(screen.getByText('選單')).toBeInTheDocument();
    expect(screen.getByText('任務管理')).toBeInTheDocument();
    expect(screen.getByText('統計數據')).toBeInTheDocument();
    expect(screen.getByText('設定')).toBeInTheDocument();
  });

  it('should close menu when close button is clicked', () => {
    render(<MobileNavigation {...mockProps} />);
    
    const menuToggle = screen.getByLabelText('切換選單');
    
    // Open menu
    fireEvent.click(menuToggle);
    expect(menuToggle).toHaveClass('active');
    
    // Close menu using close button
    const closeButton = screen.getByLabelText('關閉選單');
    fireEvent.click(closeButton);
    
    expect(menuToggle).not.toHaveClass('active');
  });

  it('should close menu when overlay is clicked', () => {
    render(<MobileNavigation {...mockProps} />);
    
    const menuToggle = screen.getByLabelText('切換選單');
    
    // Open menu
    fireEvent.click(menuToggle);
    expect(menuToggle).toHaveClass('active');
    
    // Close menu by clicking overlay
    const overlay = document.querySelector('.mobile-menu-overlay');
    if (overlay) {
      fireEvent.click(overlay);
    }
    
    expect(menuToggle).not.toHaveClass('active');
  });

  it('should call appropriate handlers when menu items are clicked', () => {
    render(<MobileNavigation {...mockProps} />);
    
    const menuToggle = screen.getByLabelText('切換選單');
    fireEvent.click(menuToggle);
    
    // Click task menu item
    const taskMenuItem = screen.getByText('任務管理');
    fireEvent.click(taskMenuItem);
    expect(mockProps.onToggleTasks).toHaveBeenCalledTimes(1);
    
    // Menu should close after clicking item
    expect(menuToggle).not.toHaveClass('active');
    
    // Open menu again and test other items
    fireEvent.click(menuToggle);
    
    const statsMenuItem = screen.getByText('統計數據');
    fireEvent.click(statsMenuItem);
    expect(mockProps.onToggleStats).toHaveBeenCalledTimes(1);
    
    fireEvent.click(menuToggle);
    
    const settingsMenuItem = screen.getByText('設定');
    fireEvent.click(settingsMenuItem);
    expect(mockProps.onToggleSettings).toHaveBeenCalledTimes(1);
  });

  it('should show active indicators for active panels', () => {
    const activeProps = {
      ...mockProps,
      showTasks: true,
      showStats: true
    };
    
    render(<MobileNavigation {...activeProps} />);
    
    const menuToggle = screen.getByLabelText('切換選單');
    fireEvent.click(menuToggle);
    
    // Check for active indicators
    const activeIndicators = screen.getAllByText('●');
    expect(activeIndicators).toHaveLength(2); // Tasks and Stats are active
    
    // Check for active classes
    const taskMenuItem = screen.getByText('任務管理').closest('button');
    const statsMenuItem = screen.getByText('統計數據').closest('button');
    const settingsMenuItem = screen.getByText('設定').closest('button');
    
    expect(taskMenuItem).toHaveClass('active');
    expect(statsMenuItem).toHaveClass('active');
    expect(settingsMenuItem).not.toHaveClass('active');
  });

  it('should have proper accessibility attributes', () => {
    render(<MobileNavigation {...mockProps} />);
    
    const menuToggle = screen.getByLabelText('切換選單');
    expect(menuToggle).toHaveAttribute('aria-label', '切換選單');
    
    fireEvent.click(menuToggle);
    
    const closeButton = screen.getByLabelText('關閉選單');
    expect(closeButton).toHaveAttribute('aria-label', '關閉選單');
  });

  it('should render hamburger menu icon with proper animation classes', () => {
    render(<MobileNavigation {...mockProps} />);
    
    const menuToggle = screen.getByLabelText('切換選單');
    const hamburgerLines = menuToggle.querySelectorAll('.hamburger-line');
    
    expect(hamburgerLines).toHaveLength(3);
    
    // Check that lines exist
    hamburgerLines.forEach(line => {
      expect(line).toHaveClass('hamburger-line');
    });
    
    // Click to activate
    fireEvent.click(menuToggle);
    expect(menuToggle).toHaveClass('active');
  });
});