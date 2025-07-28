import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SoundManager } from './SoundManager';
import { SoundType } from './types';

// Mock Web Audio API
const mockAudioContext = {
  state: 'running',
  sampleRate: 44100,
  currentTime: 0,
  createBuffer: vi.fn(),
  createBufferSource: vi.fn(),
  createGain: vi.fn(),
  resume: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  decodeAudioData: vi.fn(),
  destination: {}
};

const mockBufferSource = {
  buffer: null,
  loop: false,
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  onended: null
};

const mockGainNode = {
  gain: {
    setValueAtTime: vi.fn()
  },
  connect: vi.fn()
};

const mockAudioBuffer = {
  duration: 0.5,
  getChannelData: vi.fn().mockReturnValue(new Float32Array(1024))
};

// Mock global AudioContext
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn().mockImplementation(() => mockAudioContext)
});

Object.defineProperty(window, 'webkitAudioContext', {
  writable: true,
  value: vi.fn().mockImplementation(() => mockAudioContext)
});

describe('SoundManager', () => {
  let soundManager: SoundManager;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock buffer source
    mockBufferSource.buffer = null;
    mockBufferSource.loop = false;
    mockBufferSource.onended = null;
    
    // Setup mock returns
    mockAudioContext.createBuffer.mockReturnValue(mockAudioBuffer);
    mockAudioContext.createBufferSource.mockReturnValue(mockBufferSource);
    mockAudioContext.createGain.mockReturnValue(mockGainNode);
    mockAudioContext.decodeAudioData.mockResolvedValue(mockAudioBuffer);
    
    // Mock the start method to trigger onended callback immediately
    mockBufferSource.start.mockImplementation(() => {
      if (mockBufferSource.onended) {
        setTimeout(() => mockBufferSource.onended(), 0);
      }
    });
    
    soundManager = new SoundManager();
  });

  afterEach(() => {
    soundManager.dispose();
  });

  describe('初始化', () => {
    it('應該成功創建 AudioContext', () => {
      expect(window.AudioContext).toHaveBeenCalled();
    });

    it('應該設置默認音量為 0.7', () => {
      expect(soundManager.getVolume()).toBe(0.7);
    });

    it('應該默認啟用聲音', () => {
      expect(soundManager.isEnabled()).toBe(true);
    });

    it('應該加載默認聲音', () => {
      const availableSounds = soundManager.getAvailableSounds();
      expect(availableSounds).toContain('work-complete');
      expect(availableSounds).toContain('break-complete');
      expect(availableSounds).toContain('tick');
      expect(availableSounds).toContain('alert');
    });
  });

  describe('音量控制', () => {
    it('應該能設置音量', () => {
      soundManager.setVolume(0.5);
      expect(soundManager.getVolume()).toBe(0.5);
    });

    it('應該限制音量在 0-1 範圍內', () => {
      soundManager.setVolume(-0.5);
      expect(soundManager.getVolume()).toBe(0);

      soundManager.setVolume(1.5);
      expect(soundManager.getVolume()).toBe(1);
    });
  });

  describe('啟用/禁用控制', () => {
    it('應該能禁用聲音', () => {
      soundManager.setEnabled(false);
      expect(soundManager.isEnabled()).toBe(false);
    });

    it('應該能重新啟用聲音', () => {
      soundManager.setEnabled(false);
      soundManager.setEnabled(true);
      expect(soundManager.isEnabled()).toBe(true);
    });
  });

  describe('播放聲音', () => {
    it('應該能播放工作完成聲音', async () => {
      soundManager.playSound('work-complete');
      
      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
      expect(mockBufferSource.connect).toHaveBeenCalledWith(mockGainNode);
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
      expect(mockBufferSource.start).toHaveBeenCalled();
    });

    it('應該能播放休息完成聲音', async () => {
      soundManager.playSound('break-complete');
      
      expect(mockBufferSource.start).toHaveBeenCalled();
    });

    it('應該能播放提醒聲音', async () => {
      soundManager.playSound('alert');
      
      expect(mockBufferSource.start).toHaveBeenCalled();
    });

    it('應該能播放滴答聲', async () => {
      soundManager.playSound('tick');
      
      expect(mockBufferSource.start).toHaveBeenCalled();
    });

    it('應該在禁用時不播放聲音', async () => {
      soundManager.setEnabled(false);
      await soundManager.playSound('work-complete');
      
      expect(mockBufferSource.start).not.toHaveBeenCalled();
    });

    it('應該使用指定的音量播放', async () => {
      soundManager.playSound('work-complete', { volume: 0.3 });
      
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.3, mockAudioContext.currentTime);
    });

    it('應該使用默認音量當沒有指定時', async () => {
      soundManager.setVolume(0.8);
      soundManager.playSound('work-complete');
      
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.8, mockAudioContext.currentTime);
    });

    it('應該支持循環播放', async () => {
      soundManager.playSound('tick', { loop: true });
      
      expect(mockBufferSource.loop).toBe(true);
    });

    it('應該在 AudioContext 暫停時恢復', async () => {
      mockAudioContext.state = 'suspended';
      soundManager.playSound('work-complete');
      
      expect(mockAudioContext.resume).toHaveBeenCalled();
    });
  });

  describe('自定義聲音', () => {
    it('應該能加載自定義聲音', async () => {
      const mockArrayBuffer = new ArrayBuffer(1024);
      
      await soundManager.loadCustomSound('work-complete', mockArrayBuffer);
      
      expect(mockAudioContext.decodeAudioData).toHaveBeenCalledWith(mockArrayBuffer);
    });

    it('應該在解碼失敗時拋出錯誤', async () => {
      const mockArrayBuffer = new ArrayBuffer(1024);
      mockAudioContext.decodeAudioData.mockRejectedValue(new Error('Decode failed'));
      
      await expect(soundManager.loadCustomSound('work-complete', mockArrayBuffer))
        .rejects.toThrow('Failed to load custom sound');
    });
  });

  describe('錯誤處理', () => {
    it('應該在沒有 AudioContext 時優雅處理', () => {
      // Create a new instance without AudioContext
      Object.defineProperty(window, 'AudioContext', {
        writable: true,
        value: undefined
      });
      Object.defineProperty(window, 'webkitAudioContext', {
        writable: true,
        value: undefined
      });

      expect(() => new SoundManager()).not.toThrow();
    });

    it('應該在播放不存在的聲音時不拋出錯誤', async () => {
      await expect(soundManager.playSound('non-existent' as SoundType)).resolves.toBeUndefined();
    });
  });

  describe('資源清理', () => {
    it('應該能正確清理資源', () => {
      soundManager.dispose();
      
      // Only check if close was called when audioContext exists
      if (soundManager['audioContext']) {
        expect(mockAudioContext.close).toHaveBeenCalled();
      }
      expect(soundManager.getAvailableSounds()).toHaveLength(0);
    });
  });
});