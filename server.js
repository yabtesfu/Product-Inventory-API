const http = require('http');
const { readProjects } = require('./dataStore');

const PORT = 3000;

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const server = http.createServer(async (req, res) => {
  const { method, url } = req;

  if (method === 'GET' && url === '/') {
    return sendJson(res, 200, { message: 'Project Inventory API is running' });
  }

  if (method === 'GET' && url === '/projects') {
    try {
      const projects = await readProjects();
      return sendJson(res, 200, projects);
    } catch (err) {
      return sendJson(res, 500, { error: 'Failed to read projects' });
    }
  }

  const projectIdMatch = url.match(/^\/projects\/([^/]+)$/);
  if (method === 'GET' && projectIdMatch) {
    const id = Number(projectIdMatch[1]);
    try {
      const projects = await readProjects();
      const project = projects.find((p) => p.id === id);
      if (!project) {
        return sendJson(res, 404, { error: `Project with id ${id} not found` });
      }
      return sendJson(res, 200, project);
    } catch (err) {
      return sendJson(res, 500, { error: 'Failed to read projects' });
    }
  }

  sendJson(res, 404, { error: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
