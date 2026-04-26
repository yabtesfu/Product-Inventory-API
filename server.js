const http = require('http');
const { readProjects, writeProjects } = require('./dataStore');

const PORT = 3000;

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const parseBody = (req) =>
  new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });

const nextId = (projects) =>
  projects.length === 0 ? 1 : Math.max(...projects.map((p) => p.id)) + 1;

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  const projectIdMatch = url.match(/^\/projects\/([^/]+)$/);

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

  if (method === 'POST' && url === '/projects') {
    try {
      const body = await parseBody(req);
      if (!body.name) {
        return sendJson(res, 400, { error: 'name is required' });
      }
      const projects = await readProjects();
      const newProject = {
        id: nextId(projects),
        name: body.name,
        description: body.description || '',
        status: body.status || 'planned',
        createdAt: new Date().toISOString(),
      };
      projects.push(newProject);
      await writeProjects(projects);
      return sendJson(res, 201, newProject);
    } catch (err) {
      if (err.message === 'Invalid JSON') {
        return sendJson(res, 400, { error: 'Invalid JSON body' });
      }
      return sendJson(res, 500, { error: 'Failed to create project' });
    }
  }

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

  if (method === 'PUT' && projectIdMatch) {
    const id = Number(projectIdMatch[1]);
    try {
      const body = await parseBody(req);
      const projects = await readProjects();
      const idx = projects.findIndex((p) => p.id === id);
      if (idx === -1) {
        return sendJson(res, 404, { error: `Project with id ${id} not found` });
      }
      const updated = {
        ...projects[idx],
        ...body,
        id: projects[idx].id,
        createdAt: projects[idx].createdAt,
      };
      projects[idx] = updated;
      await writeProjects(projects);
      return sendJson(res, 200, updated);
    } catch (err) {
      if (err.message === 'Invalid JSON') {
        return sendJson(res, 400, { error: 'Invalid JSON body' });
      }
      return sendJson(res, 500, { error: 'Failed to update project' });
    }
  }

  if (method === 'DELETE' && projectIdMatch) {
    const id = Number(projectIdMatch[1]);
    try {
      const projects = await readProjects();
      const idx = projects.findIndex((p) => p.id === id);
      if (idx === -1) {
        return sendJson(res, 404, { error: `Project with id ${id} not found` });
      }
      const [removed] = projects.splice(idx, 1);
      await writeProjects(projects);
      return sendJson(res, 200, { message: 'Project deleted', project: removed });
    } catch (err) {
      return sendJson(res, 500, { error: 'Failed to delete project' });
    }
  }

  sendJson(res, 404, { error: 'Route not found' });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
