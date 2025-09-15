const fs = require('fs');
const path = require('path');

const dirToDelete = path.join(__dirname, '..', '.next');

fs.rm(dirToDelete, { recursive: true, force: true }, (err) => {
  if (err) {
    console.error(`Error deleting .next directory:`, err);
  } else {
    console.log('.next directory deleted successfully.');
  }
});
