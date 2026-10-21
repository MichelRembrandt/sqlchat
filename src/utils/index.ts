export function sanitizeInput(input: unknown) {    
    console.debug("Sanitizing input:", input);
    if (typeof input === 'string') return input;
    if (input && typeof input === 'object') {
        const record = input as Record<string, unknown>;
        const candidate = record.sql ?? record.query ?? record.sql_query ?? record.input;
        if (typeof candidate === 'string') return candidate;
        const firstStr = Object.values(record).find((v): v is string => typeof v === 'string');
        return firstStr ?? null;
    }
  return null;
}