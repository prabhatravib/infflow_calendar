export const formatDateForICS = (dateString: string): string => {
  return dateString.replace(/[-:]/g, '').split('.')[0];
};

export const escapeICSField = (field: string): string => {
  return field.replace(/\n/g, '\\n');
};

export const generateUUID = (): string => {
  return crypto.randomUUID();
};

export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

export const validateDateRange = (from: string, to: string): boolean => {
  const fromMs = Date.parse(from);
  const toMs = Date.parse(to);
  return !isNaN(fromMs) && !isNaN(toMs);
};
