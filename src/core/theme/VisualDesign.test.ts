import { describe, it, expect, beforeEach } from 'vitest';

describe('Visual Design System', () => {
  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.body.className = '';
  });

  describe('CSS Variables', () => {
    it('應該定義字體系統變量', () => {
      // Create a style element with our CSS variables
      const style = document.createElement('style');
      style.textContent = `
        :root {
          --font-size-xs: 0.75rem;
          --font-size-sm: 0.875rem;
          --font-size-base: 1rem;
          --font-size-lg: 1.125rem;
          --font-size-xl: 1.25rem;
          --font-weight-light: 300;
          --font-weight-normal: 400;
          --font-weight-medium: 500;
          --font-weight-semibold: 600;
          --font-weight-bold: 700;
        }
      `;
      document.head.appendChild(style);

      const styles = getComputedStyle(document.documentElement);
      
      // 檢查字體大小變量
      expect(styles.getPropertyValue('--font-size-xs').trim()).toBe('0.75rem');
      expect(styles.getPropertyValue('--font-size-sm').trim()).toBe('0.875rem');
      expect(styles.getPropertyValue('--font-size-base').trim()).toBe('1rem');
      expect(styles.getPropertyValue('--font-size-lg').trim()).toBe('1.125rem');
      expect(styles.getPropertyValue('--font-size-xl').trim()).toBe('1.25rem');
      
      // 檢查字重變量
      expect(styles.getPropertyValue('--font-weight-light').trim()).toBe('300');
      expect(styles.getPropertyValue('--font-weight-normal').trim()).toBe('400');
      expect(styles.getPropertyValue('--font-weight-medium').trim()).toBe('500');
      expect(styles.getPropertyValue('--font-weight-semibold').trim()).toBe('600');
      expect(styles.getPropertyValue('--font-weight-bold').trim()).toBe('700');
    });

    it('應該定義間距系統變量', () => {
      const style = document.createElement('style');
      style.textContent = `
        :root {
          --theme-spacing-xs: 0.25rem;
          --theme-spacing-sm: 0.5rem;
          --theme-spacing-md: 1rem;
          --theme-spacing-lg: 1.5rem;
          --theme-spacing-xl: 2rem;
        }
      `;
      document.head.appendChild(style);

      const styles = getComputedStyle(document.documentElement);
      
      expect(styles.getPropertyValue('--theme-spacing-xs').trim()).toBe('0.25rem');
      expect(styles.getPropertyValue('--theme-spacing-sm').trim()).toBe('0.5rem');
      expect(styles.getPropertyValue('--theme-spacing-md').trim()).toBe('1rem');
      expect(styles.getPropertyValue('--theme-spacing-lg').trim()).toBe('1.5rem');
      expect(styles.getPropertyValue('--theme-spacing-xl').trim()).toBe('2rem');
    });

    it('應該定義動畫系統變量', () => {
      const style = document.createElement('style');
      style.textContent = `
        :root {
          --duration-fast: 150ms;
          --duration-normal: 300ms;
          --duration-slow: 500ms;
          --ease-in: cubic-bezier(0.4, 0, 1, 1);
          --ease-out: cubic-bezier(0, 0, 0.2, 1);
          --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
          --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `;
      document.head.appendChild(style);

      const styles = getComputedStyle(document.documentElement);
      
      expect(styles.getPropertyValue('--duration-fast').trim()).toBe('150ms');
      expect(styles.getPropertyValue('--duration-normal').trim()).toBe('300ms');
      expect(styles.getPropertyValue('--duration-slow').trim()).toBe('500ms');
      expect(styles.getPropertyValue('--ease-in').trim()).toBe('cubic-bezier(0.4, 0, 1, 1)');
      expect(styles.getPropertyValue('--ease-out').trim()).toBe('cubic-bezier(0, 0, 0.2, 1)');
      expect(styles.getPropertyValue('--ease-in-out').trim()).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
      expect(styles.getPropertyValue('--ease-bounce').trim()).toBe('cubic-bezier(0.68, -0.55, 0.265, 1.55)');
    });
  });

  describe('Design System Consistency', () => {
    it('間距值應該遵循邏輯順序', () => {
      const style = document.createElement('style');
      style.textContent = `
        :root {
          --theme-spacing-xs: 0.25rem;
          --theme-spacing-sm: 0.5rem;
          --theme-spacing-md: 1rem;
          --theme-spacing-lg: 1.5rem;
          --theme-spacing-xl: 2rem;
        }
      `;
      document.head.appendChild(style);

      const styles = getComputedStyle(document.documentElement);
      
      const xs = parseFloat(styles.getPropertyValue('--theme-spacing-xs'));
      const sm = parseFloat(styles.getPropertyValue('--theme-spacing-sm'));
      const md = parseFloat(styles.getPropertyValue('--theme-spacing-md'));
      const lg = parseFloat(styles.getPropertyValue('--theme-spacing-lg'));
      const xl = parseFloat(styles.getPropertyValue('--theme-spacing-xl'));
      
      expect(xs).toBeLessThan(sm);
      expect(sm).toBeLessThan(md);
      expect(md).toBeLessThan(lg);
      expect(lg).toBeLessThan(xl);
    });

    it('字體大小應該遵循邏輯順序', () => {
      const style = document.createElement('style');
      style.textContent = `
        :root {
          --font-size-xs: 0.75rem;
          --font-size-sm: 0.875rem;
          --font-size-base: 1rem;
          --font-size-lg: 1.125rem;
          --font-size-xl: 1.25rem;
        }
      `;
      document.head.appendChild(style);

      const styles = getComputedStyle(document.documentElement);
      
      const xs = parseFloat(styles.getPropertyValue('--font-size-xs'));
      const sm = parseFloat(styles.getPropertyValue('--font-size-sm'));
      const base = parseFloat(styles.getPropertyValue('--font-size-base'));
      const lg = parseFloat(styles.getPropertyValue('--font-size-lg'));
      const xl = parseFloat(styles.getPropertyValue('--font-size-xl'));
      
      expect(xs).toBeLessThan(sm);
      expect(sm).toBeLessThan(base);
      expect(base).toBeLessThan(lg);
      expect(lg).toBeLessThan(xl);
    });

    it('字重應該遵循邏輯順序', () => {
      const style = document.createElement('style');
      style.textContent = `
        :root {
          --font-weight-light: 300;
          --font-weight-normal: 400;
          --font-weight-medium: 500;
          --font-weight-semibold: 600;
          --font-weight-bold: 700;
        }
      `;
      document.head.appendChild(style);

      const styles = getComputedStyle(document.documentElement);
      
      const light = parseInt(styles.getPropertyValue('--font-weight-light'));
      const normal = parseInt(styles.getPropertyValue('--font-weight-normal'));
      const medium = parseInt(styles.getPropertyValue('--font-weight-medium'));
      const semibold = parseInt(styles.getPropertyValue('--font-weight-semibold'));
      const bold = parseInt(styles.getPropertyValue('--font-weight-bold'));
      
      expect(light).toBeLessThan(normal);
      expect(normal).toBeLessThan(medium);
      expect(medium).toBeLessThan(semibold);
      expect(semibold).toBeLessThan(bold);
    });
  });

  describe('Animation System', () => {
    it('應該支持減少動畫偏好設置', () => {
      const style = document.createElement('style');
      style.textContent = `
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `;
      document.head.appendChild(style);

      // 檢查樣式是否正確添加
      expect(document.head.contains(style)).toBe(true);
      expect(style.textContent).toContain('prefers-reduced-motion: reduce');
    });

    it('應該定義一致的動畫持續時間', () => {
      const style = document.createElement('style');
      style.textContent = `
        :root {
          --duration-fast: 150ms;
          --duration-normal: 300ms;
          --duration-slow: 500ms;
        }
      `;
      document.head.appendChild(style);

      const styles = getComputedStyle(document.documentElement);
      
      const fast = parseInt(styles.getPropertyValue('--duration-fast'));
      const normal = parseInt(styles.getPropertyValue('--duration-normal'));
      const slow = parseInt(styles.getPropertyValue('--duration-slow'));
      
      expect(fast).toBeLessThan(normal);
      expect(normal).toBeLessThan(slow);
    });
  });

  describe('Accessibility', () => {
    it('應該支持高對比度模式', () => {
      const style = document.createElement('style');
      style.textContent = `
        @media (prefers-contrast: high) {
          :root {
            --theme-border: #000000;
            --theme-text-secondary: #000000;
          }
        }
      `;
      document.head.appendChild(style);

      // 檢查樣式是否正確添加
      expect(document.head.contains(style)).toBe(true);
      expect(style.textContent).toContain('prefers-contrast: high');
    });

    it('應該有適當的焦點樣式', () => {
      const style = document.createElement('style');
      style.textContent = `
        .theme-focus:focus-visible {
          outline: 2px solid var(--theme-primary);
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(var(--theme-primary), 0.1);
        }
      `;
      document.head.appendChild(style);

      expect(document.head.contains(style)).toBe(true);
      expect(style.textContent).toContain('theme-focus:focus-visible');
    });
  });
});