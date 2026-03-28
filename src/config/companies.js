export const companies = [
  {
    id: 'tesla',
    name: 'Tesla',
    region: 'US',
    color: '#00d4ff', // electric blue
    products: [
      { id: 'model3', name: 'Model 3', category: 'Vehicles' },
      { id: 'modely', name: 'Model Y', category: 'Vehicles' },
      { id: 'cybertruck', name: 'Cybertruck', category: 'Vehicles' },
      { id: 'semi', name: 'Semi', category: 'Vehicles' },
      { id: 'fsd', name: 'FSD', category: 'Software' },
      { id: 'supercharger', name: 'Supercharger Network', category: 'Energy/Infra' },
      { id: 'powerwall', name: 'Powerwall / Megapack', category: 'Energy/Infra' },
    ]
  },
  {
    id: 'byd',
    name: 'BYD',
    region: 'China',
    color: '#ff3366', // crimson
    products: [
      { id: 'seal', name: 'Seal', category: 'Vehicles' },
      { id: 'dolphin', name: 'Dolphin', category: 'Vehicles' },
      { id: 'han', name: 'Han', category: 'Vehicles' },
      { id: 'tang', name: 'Tang', category: 'Vehicles' },
      { id: 'seagull', name: 'Seagull', category: 'Vehicles' },
      { id: 'shark', name: 'Shark', category: 'Vehicles' },
      { id: 'blade', name: 'Blade Battery', category: 'Energy/Infra' },
      { id: 'dipilot', name: 'DiPilot', category: 'Software' },
    ]
  },
  {
    id: 'rivian',
    name: 'Rivian',
    region: 'US',
    color: '#00ff88', // forest green
    products: [
      { id: 'r1t', name: 'R1T', category: 'Vehicles' },
      { id: 'r1s', name: 'R1S', category: 'Vehicles' },
      { id: 'r2', name: 'R2', category: 'Vehicles' },
      { id: 'rcv', name: 'Commercial Van', category: 'Vehicles' },
    ]
  },
  {
    id: 'nio',
    name: 'NIO',
    region: 'China',
    color: '#3498db', // sky blue
    products: [
      { id: 'et7', name: 'ET7', category: 'Vehicles' },
      { id: 'es6', name: 'ES6', category: 'Vehicles' },
      { id: 'et5', name: 'ET5', category: 'Vehicles' },
      { id: 'battery_swap', name: 'Battery Swap Network', category: 'Energy/Infra' },
    ]
  },
  {
    id: 'lucid',
    name: 'Lucid',
    region: 'US',
    color: '#b5a642', // gold
    products: [
      { id: 'air', name: 'Air', category: 'Vehicles' },
      { id: 'gravity', name: 'Gravity', category: 'Vehicles' },
    ]
  },
  {
    id: 'xpeng',
    name: 'XPeng',
    region: 'China',
    color: '#2ecc71', // emerald
    products: [
      { id: 'g6', name: 'G6', category: 'Vehicles' },
      { id: 'p7', name: 'P7', category: 'Vehicles' },
      { id: 'x9', name: 'X9', category: 'Vehicles' },
      { id: 'xngp', name: 'XNGP', category: 'Software' },
    ]
  },
  {
    id: 'liauto',
    name: 'Li Auto',
    region: 'China',
    color: '#f1c40f', // yellow
    products: [
      { id: 'l9', name: 'L9', category: 'Vehicles' },
      { id: 'l7', name: 'L7', category: 'Vehicles' },
      { id: 'mega', name: 'MEGA', category: 'Vehicles' },
    ]
  },
  {
    id: 'vw',
    name: 'Volkswagen',
    region: 'EU',
    color: '#0984e3', // blue
    products: [
      { id: 'id4', name: 'ID.4', category: 'Vehicles' },
      { id: 'idbuzz', name: 'ID.Buzz', category: 'Vehicles' },
      { id: 'id7', name: 'ID.7', category: 'Vehicles' },
    ]
  },
  {
    id: 'hyundai',
    name: 'Hyundai/Kia',
    region: 'Korea',
    color: '#34495e', // dark blue/grey
    products: [
      { id: 'ioniq5', name: 'Ioniq 5', category: 'Vehicles' },
      { id: 'ioniq6', name: 'Ioniq 6', category: 'Vehicles' },
      { id: 'ev6', name: 'EV6', category: 'Vehicles' },
      { id: 'ev9', name: 'EV9', category: 'Vehicles' },
    ]
  },
  {
    id: 'ford',
    name: 'Ford',
    region: 'US',
    color: '#00529b', // classic blue
    products: [
      { id: 'mache', name: 'Mustang Mach-E', category: 'Vehicles' },
      { id: 'f150', name: 'F-150 Lightning', category: 'Vehicles' },
    ]
  },
  {
    id: 'gm',
    name: 'GM',
    region: 'US',
    color: '#2980b9', // general blue
    products: [
      { id: 'equinox', name: 'Equinox EV', category: 'Vehicles' },
      { id: 'blazer', name: 'Blazer EV', category: 'Vehicles' },
      { id: 'hummer', name: 'Hummer EV', category: 'Vehicles' },
    ]
  },
  {
    id: 'bmw',
    name: 'BMW',
    region: 'EU',
    color: '#8e44ad', // purple
    products: [
      { id: 'ix', name: 'iX', category: 'Vehicles' },
      { id: 'i4', name: 'i4', category: 'Vehicles' },
      { id: 'i5', name: 'i5', category: 'Vehicles' },
      { id: 'i7', name: 'i7', category: 'Vehicles' },
    ]
  }
];

export const getCompanyById = (id) => companies.find(c => c.id === id);
