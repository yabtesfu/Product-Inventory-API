const fs = require('fs').promises;
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

const readProjects = async () => {
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw);
};

const writeProjects = async (projects) => {
  await fs.writeFile(DATA_FILE, JSON.stringify(projects, null, 2), 'utf8');
};

module.exports = { readProjects, writeProjects };
