function formatMeta(meta) {
  if (!meta) {
    return '';
  }

  try {
    return JSON.stringify(meta);
  } catch {
    return String(meta);
  }
}

function write(level, message, meta) {
  const timestamp = new Date().toISOString();
  const suffix = formatMeta(meta);
  console.log(`[${timestamp}] [${level}] ${message}${suffix ? ` ${suffix}` : ''}`);
}

export const logger = {
  info(message, meta) {
    write('INFO', message, meta);
  },
  warn(message, meta) {
    write('WARN', message, meta);
  },
  error(message, meta) {
    write('ERROR', message, meta);
  },
};
