const SESSION_START = performance.now();

type LogData = Record<string, string | number | boolean | null | undefined>;
type ResourceCountFn = () => Record<string, number>;
type IpcSink = (message: string) => void;

let _resourceCountFn: ResourceCountFn | null = null;
let _ipcSink: IpcSink | null = null;

export function registerResourceCounter(fn: ResourceCountFn): void {
  _resourceCountFn = fn;
}

export function registerIpcSink(fn: IpcSink): void {
  _ipcSink = fn;
}

function elapsed(): string {
  return ((performance.now() - SESSION_START) / 1000).toFixed(3);
}

function flat(tag: string, msg: string, data?: LogData): string {
  const parts = [`[devlog +${elapsed()}] ${tag} | ${msg}`];
  if (data) {
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) parts.push(`${k}=${v}`);
    }
  }
  return parts.join(' ');
}

function fmt(
  tag: string,
  msg: string,
  data?: LogData
): [string, string, LogData | string] {
  const prefix = `%c[devlog +${elapsed()}] ${tag} | ${msg}`;
  const style = 'color:#7c6f64;font-weight:bold';
  return data ? [prefix, style, data] : [prefix, style, ''];
}

function toIpc(tag: string, msg: string, data?: LogData): void {
  if (!_ipcSink) return;
  _ipcSink(flat(tag, msg, data));
}

function log(tag: string, msg: string, data?: LogData): void {
  const [prefix, style, payload] = fmt(tag, msg, data);
  if (data) {
    console.log(prefix, style, payload);
  } else {
    console.log(prefix, style);
  }
  toIpc(tag, msg, data);
}

function warn(tag: string, msg: string, data?: LogData): void {
  const [prefix, style, payload] = fmt(tag, msg, data);
  if (data) {
    console.warn(prefix, style, payload);
  } else {
    console.warn(prefix, style);
  }
  toIpc(tag, msg, data);
}

function error(tag: string, msg: string, data?: LogData): void {
  const [prefix, style, payload] = fmt(tag, msg, data);
  if (data) {
    console.error(prefix, style, payload);
  } else {
    console.error(prefix, style);
  }
  toIpc(tag, msg, data);
}

function resources(tag: string): void {
  if (!_resourceCountFn) {
    warn(tag, 'resources: no counter registered');
    return;
  }
  const counts = _resourceCountFn();
  log(tag, 'resources', counts);
}

function cid(): string {
  return Math.random().toString(16).slice(2, 10);
}

export const devlog: typeof log & {
  warn: typeof warn;
  error: typeof error;
  resources: typeof resources;
  cid: typeof cid;
} = Object.assign(log, { warn, error, resources, cid });
