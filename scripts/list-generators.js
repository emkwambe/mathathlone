
const { GENERATORS } = require('./src/lib/competition/generators');
const prefix = 'g7_';
const types = Object.keys(GENERATORS).filter(k => k.startsWith(prefix));
console.log(JSON.stringify(types));
