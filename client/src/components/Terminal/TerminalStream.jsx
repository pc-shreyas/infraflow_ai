import { useEffect, useRef } from 'react';

const normaliseLineEndings = (value) => String(value || '').replace(/\r?\n/g, '\r\n');

const logText = (log) => {
  if (log?.rawStreamOutput) return log.rawStreamOutput;
  const agent = log?.agent ? String(log.agent).toUpperCase() : 'AGENT';
  return `[${agent}] ${log?.message || ''}`;
};

export default function TerminalStream({ logs = [], socket, executionId }) {
  const terminalHostRef = useRef(null);
  const terminalRef = useRef(null);
  const pendingOutputRef = useRef([]);
  const hasHydratedRef = useRef(false);

  const write = (output) => {
    if (!output) return;
    const formattedOutput = normaliseLineEndings(output);
    if (terminalRef.current) terminalRef.current.write(formattedOutput);
    else pendingOutputRef.current.push(formattedOutput);
  };

  useEffect(() => {
    let disposed = false;
    let terminal;

    // xterm accesses browser APIs while constructing the terminal, so only load it
    // after this client-side component has mounted.
    import('@xterm/xterm').then(({ Terminal }) => {
      if (disposed || !terminalHostRef.current) return;

      terminal = new Terminal({
        cursorBlink: true,
        cursorStyle: 'block',
        convertEol: true,
        fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
        fontSize: 13,
        lineHeight: 1.25,
        rows: 20,
        theme: {
          background: '#090d16',
          foreground: '#e2e8f0',
          cursor: '#10b981',
          cursorAccent: '#090d16',
          selectionBackground: '#1e293b',
        },
      });

      terminal.open(terminalHostRef.current);
      terminalRef.current = terminal;
      terminal.write('\x1b[32m[InfraFlow AI]\x1b[0m Terminal stream connected.\r\n');
      pendingOutputRef.current.splice(0).forEach((output) => terminal.write(output));
    });

    return () => {
      disposed = true;
      terminal?.dispose();
      terminalRef.current = null;
    };
  }, []);

  useEffect(() => {
    // The API returns the complete, ordered history. Hydrate it only once so a
    // parent re-render does not replay the entire execution in the terminal.
    if (hasHydratedRef.current || !logs.length) return;
    hasHydratedRef.current = true;
    logs.forEach((log) => write(`${logText(log)}\r\n`));
  }, [logs]);

  useEffect(() => {
    if (!socket || !executionId) return undefined;
    const joinExecutionRoom = () => socket.emit('join:execution', executionId);
    const handleLogEvent = (log) => {
      if (log?.executionId && String(log.executionId) !== String(executionId)) return;
      write(`${logText(log)}\r\n`);
    };

    joinExecutionRoom();
    socket.on('connect', joinExecutionRoom);
    socket.on('execution:log', handleLogEvent);
    return () => {
      socket.off('connect', joinExecutionRoom);
      socket.off('execution:log', handleLogEvent);
      socket.emit('leave:execution', executionId);
    };
  }, [socket, executionId]);

  return (
    <section className="w-full overflow-hidden rounded-lg border border-slate-800 bg-[#090d16] p-3 shadow-xl">
      <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500/80" />
          <span className="h-3 w-3 rounded-full bg-amber-500/80" />
          <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 font-mono text-xs text-slate-400">bash — infraflow-agent-stream</span>
        </div>
        <span className="flex items-center gap-1 font-mono text-xs text-emerald-400"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> LIVE STREAM</span>
      </div>
      <div ref={terminalHostRef} className="min-h-[360px] w-full overflow-hidden" />
    </section>
  );
}
