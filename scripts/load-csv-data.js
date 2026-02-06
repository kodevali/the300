const fs = require('fs');
const path = require('path');

// Read CSV file
const csvPath = 'c:/Users/s4lea/Downloads/the300_backup_2026-02-04T19-48-51-288Z.csv';
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV (handling quoted fields with commas)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current.trim());
  return result;
}

const lines = csvContent.split('\n').filter(line => line.trim());
const headers = parseCSVLine(lines[0]);

const users = [];

for (let i = 1; i < lines.length; i++) {
  const values = parseCSVLine(lines[i]);
  
  if (values.length < 9) continue; // Skip invalid rows
  
  const user = {
    id: values[0] || '',
    name: values[1] || '',
    email: values[2] || '',
    designation: values[3] || '',
    manager: values[4] || '',
    department: values[5] || '',
    lineOfBusiness: values[6] || '',
    location: values[7] || '',
    city: values[8] || '',
  };
  
  // Add optional fields
  if (values[9] && values[9].trim() && values[10] && values[10].trim()) {
    user.modifier = {
      name: values[9].trim(),
      email: values[10].trim(),
    };
  }
  
  if (values[11] && values[11].trim()) {
    user.reason = values[11].trim();
  }
  
  if (values[12] && values[12].trim()) {
    user.modifiedAt = values[12].trim();
  }
  
  users.push(user);
}

// Create data structure
const data = {
  users: users,
  roles: {},
  admins: [],
  reasons: [],
  locks: {},
  summaryViewLobs: [],
  summaryViewDelegateLobs: [],
  consolidatedViewUsers: [],
  notifications: {
    to: [],
    cc: [],
    bcc: [],
  },
  changelog: [],
};

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Write data file
const dataPath = path.join(dataDir, 'local-data.json');
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');

console.log(`Successfully loaded ${users.length} users from CSV into local-data.json`);
