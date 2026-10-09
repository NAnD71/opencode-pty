import { describe, it, expect } from 'bun:test'
import { sanitizeAnsi } from '../src/plugin/pty/sanitize.ts'

describe('sanitizeAnsi', () => {
  it('strips CSI escape sequences', () => {
    expect(sanitizeAnsi('\x1b[?9001h')).toBe('')
    expect(sanitizeAnsi('\x1b[?1004h')).toBe('')
    expect(sanitizeAnsi('\x1b[?25l')).toBe('')
    expect(sanitizeAnsi('\x1b[2J')).toBe('')
    expect(sanitizeAnsi('\x1b[31mred\x1b[0m')).toBe('red')
  })

  it('strips OSC escape sequences', () => {
    expect(sanitizeAnsi('\x1b]0;window title\x07')).toBe('')
    expect(sanitizeAnsi('before\x1b]0;title\x07after')).toBe('beforeafter')
  })

  it('strips a lone ESC character', () => {
    expect(sanitizeAnsi('hello\x1b')).toBe('hello')
    expect(sanitizeAnsi('hello\x1b\x1b')).toBe('hello')
  })

  it('leaves plain text unchanged', () => {
    expect(sanitizeAnsi('hello world')).toBe('hello world')
    expect(sanitizeAnsi('line1\nline2')).toBe('line1\nline2')
    expect(sanitizeAnsi('error: file not found')).toBe('error: file not found')
  })

  it('handles mixed real-world terminal output', () => {
    const raw =
      '\x1b[?9001h\x1b[?1004h\x1b[?25l\x1b[2J\x1b]0;playwright\x07Running 1 test\n\x1b[32m✓ passed\x1b[0m'
    expect(sanitizeAnsi(raw)).toBe('Running 1 test\n✓ passed')
  })

  it('can be disabled via PTY_SANITIZE_OUTPUT=false', () => {
    const original = process.env.PTY_SANITIZE_OUTPUT
    process.env.PTY_SANITIZE_OUTPUT = 'false'
    try {
      expect(sanitizeAnsi('\x1b[31mred\x1b[0m')).toBe('\x1b[31mred\x1b[0m')
    } finally {
      process.env.PTY_SANITIZE_OUTPUT = original
    }
  })
})

describe('sanitizeOutput plugin option', () => {
  it('plugin option overrides the env var', async () => {
    const { setAnsiSanitizationOverride } = await import('../src/plugin/pty/sanitize.ts')
    const original = process.env.PTY_SANITIZE_OUTPUT
    process.env.PTY_SANITIZE_OUTPUT = 'true'
    try {
      setAnsiSanitizationOverride(false)
      expect(sanitizeAnsi('\x1b[31mred\x1b[0m')).toBe('\x1b[31mred\x1b[0m')
      setAnsiSanitizationOverride(true)
      expect(sanitizeAnsi('\x1b[31mred\x1b[0m')).toBe('red')
    } finally {
      setAnsiSanitizationOverride(undefined)
      process.env.PTY_SANITIZE_OUTPUT = original
    }
  })

  it('falls back to the env var when no option is set', async () => {
    const { setAnsiSanitizationOverride } = await import('../src/plugin/pty/sanitize.ts')
    const original = process.env.PTY_SANITIZE_OUTPUT
    process.env.PTY_SANITIZE_OUTPUT = 'false'
    try {
      setAnsiSanitizationOverride(undefined)
      expect(sanitizeAnsi('\x1b[31mred\x1b[0m')).toBe('\x1b[31mred\x1b[0m')
    } finally {
      process.env.PTY_SANITIZE_OUTPUT = original
    }
  })
})
