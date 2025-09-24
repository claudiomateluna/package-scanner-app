import { unparse } from 'papaparse';

/**
 * Export data to CSV file
 * @param data - Array of objects to export
 * @param filename - Name of the file to download
 * @param columnHeaders - Optional mapping of column headers
 */
interface DataItem {
  [key: string]: unknown;
}

export const exportToCSV = (data: DataItem[], filename: string, columnHeaders?: { [key: string]: string }) => {
  try {
    // Convert data to CSV format
    const csvData = unparse(data, {
      header: true,
      columns: columnHeaders ? Object.keys(columnHeaders) : undefined,
    });

    // Create a Blob from the CSV string
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });

    // Create a link element for download
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    // Append the link, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    alert('Error al exportar los datos');
  }
};