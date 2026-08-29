import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyToClipboard } from '@/lib/clipboard';

function setSecure(secure: boolean) {
  Object.defineProperty(window, 'isSecureContext', {
    configurable: true,
    get: () => secure,
  });
}

function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return writeText;
}

function mockExecCommand(returns: boolean) {
  const exec = vi.fn().mockReturnValue(returns);
  Object.defineProperty(document, 'execCommand', { configurable: true, value: exec });
  return exec;
}

describe('copyToClipboard', () => {
  beforeEach(() => {
    // happy-dom may not implement execCommand; ensure a clean default each test.
    mockExecCommand(false);
  });

  it('uses the async clipboard API in a secure context', async () => {
    setSecure(true);
    const writeText = mockClipboard();
    const res = await copyToClipboard('hello');
    expect(res.ok).toBe(true);
    expect(res.method).toBe('clipboard');
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to execCommand in an insecure context', async () => {
    setSecure(false);
    mockClipboard();
    const exec = mockExecCommand(true);
    const res = await copyToClipboard('hello');
    expect(res.ok).toBe(true);
    expect(res.method).toBe('execCommand');
    expect(exec).toHaveBeenCalledWith('copy');
  });

  it('returns manual when execCommand fails', async () => {
    setSecure(false);
    mockClipboard();
    mockExecCommand(false);
    const res = await copyToClipboard('hello');
    expect(res.ok).toBe(false);
    expect(res.method).toBe('manual');
  });

  it('falls through execCommand when the secure clipboard throws', async () => {
    setSecure(true);
    const writeText = mockClipboard();
    writeText.mockRejectedValueOnce(new Error('denied'));
    const exec = mockExecCommand(true);
    const res = await copyToClipboard('hello');
    expect(res.ok).toBe(true);
    expect(res.method).toBe('execCommand');
  });
});
