/**
 * Safely converts an array of flat objects into a CSV string format
 * @param {Array<Object>} data - Array of row objects
 * @returns {String} - CSV formatted string
 */
export const arrayToCsv = (data) => {
  if (!data || !data.length) return '';

  const headers = Object.keys(data[0]);

  // Wrap values in quotes and escape internal quotes
  const escapeValue = (val) => {
    if (val === null || val === undefined) return '""';
    const stringVal = String(val);
    if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
  };

  const csvRows = [
    headers.map(escapeValue).join(','), // Header row
    ...data.map(row => headers.map(header => escapeValue(row[header])).join(',')) // Data rows
  ];

  return csvRows.join('\n');
};
