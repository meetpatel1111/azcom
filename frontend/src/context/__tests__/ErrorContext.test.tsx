import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { ErrorProvider, useError } from '../ErrorContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ErrorProvider>{children}</ErrorProvider>
);

describe('ErrorContext', () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('initializes with empty notifications', () => {
    const { result } = renderHook(() => useError(), { wrapper });

    expect(result.current.notifications).toEqual([]);
  });

  it('adds error notification', () => {
    const { result } = renderHook(() => useError(), { wrapper });

    act(() => {
      result.current.showError('Test error message');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      message: 'Test error message',
      type: 'error',
      duration: 5000,
      persistent: false,
    });
  });

  it('adds warning notification', () => {
    const { result } = renderHook(() => useError(), { wrapper });

    act(() => {
      result.current.showWarning('Test warning message');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      message: 'Test warning message',
      type: 'warning',
      duration: 3000,
    });
  });

  it('adds info notification', () => {
    const { result } = renderHook(() => useError(), { wrapper });

    act(() => {
      result.current.showInfo('Test info message');
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      message: 'Test info message',
      type: 'info',
      duration: 3000,
    });
  });

  it('dismisses notification by id', () => {
    const { result } = renderHook(() => useError(), { wrapper });

    act(() => {
      result.current.showError('Test error');
    });

    const notificationId = result.current.notifications[0].id;

    act(() => {
      result.current.dismissNotification(notificationId);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('clears all notifications', () => {
    const { result } = renderHook(() => useError(), { wrapper });

    act(() => {
      result.current.showError('Error 1');
      result.current.showWarning('Warning 1');
      result.current.showInfo('Info 1');
    });

    expect(result.current.notifications).toHaveLength(3);

    act(() => {
      result.current.clearAllNotifications();
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('auto-dismisses non-persistent notifications', () => {
    const { result } = renderHook(() => useError(), { wrapper });

    act(() => {
      result.current.showError('Auto-dismiss error');
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  it('does not auto-dismiss persistent notifications', () => {
    const { result } = renderHook(() => useError(), { wrapper });

    act(() => {
      result.current.showError('Persistent error', { persistent: true });
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(result.current.notifications).toHaveLength(1);
  });

  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useError());
    }).toThrow('useError must be used within an ErrorProvider');

    consoleSpy.mockRestore();
  });
});