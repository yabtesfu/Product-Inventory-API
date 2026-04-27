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

const ALLOWED_STATUSES = ['planned', 'in-progress', 'completed'];

const validateProjectInput = (body, { requireName }) => {
  const errors = [];
  const hasName = body.name !== undefined;
  if (requireName && !hasName) {
    errors.push('name is required');
  }
  if (hasName && (typeof body.name !== 'string' || body.name.trim() === '')) {
    errors.push('name must be a non-empty string');
  }
  if (body.description !== undefined && typeof body.description !== 'string') {
    errors.push('description must be a string');
  }
  if (body.status !== undefined && !ALLOWED_STATUSES.includes(body.status)) {
    errors.push(`status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
  }
  return errors;
};

const server = http.createServer(async (req, res) => {
  const { method } = req;
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;
  const projectIdMatch = pathname.match(/^\/projects\/([^/]+)$/);

  if (method === 'GET' && pathname === '/') {
    return sendJson(res, 200, { message: 'Project Inventory API is running' });
  }

  if (method === 'GET' && pathname === '/projects') {
    try {
      let projects = await readProjects();
      const status = searchParams.get('status');
      const name = searchParams.get('name');
      if (status) {
        projects = projects.filter((p) => p.status === status);
      }
      if (name) {
        const needle = name.toLowerCase();
        projects = projects.filter((p) => p.name.toLowerCase().includes(needle));
      }
      return sendJson(res, 200, projects);
    } catch (err) {
      return sendJson(res, 500, { error: 'Failed to read projects' });
    }
  }

  if (method === 'POST' && pathname === '/projects') {
    try {
      const body = await parseBody(req);
      const errors = validateProjectInput(body, { requireName: true });
      if (errors.length > 0) {
        return sendJson(res, 400, { errors });
      }
      const projects = await readProjects();
      const newProject = {
        id: nextId(projects),
        name: body.name.trim(),
        description: (body.description || '').trim(),
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
      const errors = validateProjectInput(body, { requireName: false });
      if (errors.length > 0) {
        return sendJson(res, 400, { errors });
      }
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
