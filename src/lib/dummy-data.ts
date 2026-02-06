
import type { User } from '@/ai/schemas/workspace-users';

const locations = ["Shaheen Complex", "FTC", "Forum"];
const departments = ["Client Services", "ADC Operations", "Trade Services"];

const designationsByDept: { [key: string]: string[] } = {
  "Client Services": [
    "Client Service Manager",
    "Client Service Representative",
    "Relationship Manager",
    "Customer Support Officer",
    "Service Quality Analyst",
  ],
  "ADC Operations": [
    "ADC Operations Manager",
    "ADC Reconciliation Officer",
    "ADC Settlement Officer",
    "Card Operations Specialist",
    "ATM Operations Officer",
  ],
  "Trade Services": [
    "Trade Finance Officer",
    "Trade Operations Manager",
    "Import/Export Specialist",
    "Trade Documentation Officer",
    "Guarantees and LCs Officer",
  ],
};

const DUMMY_USERS: User[] = Array.from({ length: 50 }, (_, i) => {
    const dept = departments[i % departments.length];
    const desigs = designationsByDept[dept];
    const managerNames = ["David Lee", "Olivia Brown", "Sophia Garcia", "James Miller", "Isabella Rodriguez"];
    
    return {
        id: `${i + 1}`,
        name: `User ${i + 1}`,
        email: `user.${i+1}@example.com`,
        department: dept,
        designation: desigs[i % desigs.length],
        manager: managerNames[i % managerNames.length],
        lineOfBusiness: 'Centralized Operations',
        location: locations[i % locations.length],
        city: 'Karachi',
    }
});


// To make the data a bit more realistic, let's manually set a few key users.
DUMMY_USERS[0] = { ...DUMMY_USERS[0], name: 'Emma Johnson', department: 'Client Services', designation: 'Client Service Manager', manager: 'David Lee' };
DUMMY_USERS[1] = { ...DUMMY_USERS[1], name: 'Liam Smith', department: 'ADC Operations', designation: 'ADC Operations Manager', manager: 'Olivia Brown' };
DUMMY_USERS[2] = { ...DUMMY_USERS[2], name: 'Noah Williams', department: 'Trade Services', designation: 'Trade Operations Manager', manager: 'Sophia Garcia' };
DUMMY_USERS[3] = { ...DUMMY_USERS[3], name: 'Ava Jones', department: 'Client Services', designation: 'Relationship Manager', manager: 'David Lee' };
DUMMY_USERS[4] = { ...DUMMY_USERS[4], name: 'Oliver Davis', department: 'ADC Operations', designation: 'Card Operations Specialist', manager: 'Olivia Brown' };
DUMMY_USERS[5] = { ...DUMMY_USERS[5], name: 'Charlotte Martinez', department: 'Trade Services', designation: 'Import/Export Specialist', manager: 'Sophia Garcia' };


export { DUMMY_USERS };
