export function isAnsiSanitizationEnabled(): boolean {
  const rawValue = process.env.PTY_SANITIZE_OUTPUT ?? 'true'
  return rawValue.toLowerCase() !== 'false' && rawValue !== '0'
}

/**
 * Strips ANSI/VT escape sequences (CSI, OSC, and lone ESC) from text before
 * it is returned in `pty_read` results or `<pty_exited>` notifications.
 *
 * The raw buffer is kept untouched so the Web UI / xterm.js stream still
 * receives the original terminal output.
 */
export function sanitizeAnsi(text: string): string {
  if (!isAnsiSanitizationEnabled()) {
    return text
  }

  return Bun.stripANSI(text)
}
