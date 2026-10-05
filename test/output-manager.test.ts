import { describe, it, expect } from 'bun:test'
import { RingBuffer } from '../src/plugin/pty/buffer.ts'
import { OutputManager } from '../src/plugin/pty/output-manager.ts'
import type { PTYSession } from '../src/plugin/pty/types.ts'

function createSession(bufferContent: string): PTYSession {
  const buffer = new RingBuffer()
  buffer.append(bufferContent)
  return {
    id: 'pty_test',
    title: 'Test Session',
    command: 'echo',
    args: ['hello'],
    workdir: '/tmp',
    status: 'running',
    pid: 12345,
    createdAt: new Date(),
    parentSessionId: 'parent-session-id',
    notifyOnExit: false,
    timedOut: false,
    buffer,
    process: null,
  }
}

describe('OutputManager', () => {
  const manager = new OutputManager()

  it('strips ANSI escape sequences from read output', () => {
    const session = createSession('\x1b[31mred\x1b[0m\n\x1b[?9001h\x1b[2Jplain\n')

    const result = manager.read(session)

    expect(result.lines).toEqual(['red', 'plain'])
  })

  it('strips ANSI escape sequences from search matches', () => {
    const session = createSession('\x1b[31mred error\x1b[0m\n\x1b[32mgreen ok\x1b[0m\n')

    const result = manager.search(session, /error/)

    expect(result.matches).toHaveLength(1)
    expect(result.matches[0]?.text).toBe('red error')
    expect(result.matches[0]?.lineNumber).toBe(1)
  })

  it('leaves plain text unchanged', () => {
    const session = createSession('hello world\nno escapes\n')

    const result = manager.read(session)

    expect(result.lines).toEqual(['hello world', 'no escapes'])
  })
})
