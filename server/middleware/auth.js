const adminSessions = new Set();

// Simple session-based authentication for admin
// In production, use proper JWT or OAuth
const generateSessionId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const authMiddleware = (req, res, next) => {
  const sessionId = req.headers['x-admin-session'];
  if (!sessionId || !adminSessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

const login = (req, res) => {
  const { username, password } = req.body;
  // Simple hardcoded credentials for demo
  // In production, use proper password hashing and database
  if (username === 'admin' && password === 'admin123') {
    const sessionId = generateSessionId();
    adminSessions.add(sessionId);
    // Auto-expire session after 1 hour
    setTimeout(() => adminSessions.delete(sessionId), 3600000);
    return res.json({ sessionId, expiresIn: 3600 });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
};

const logout = (req, res) => {
  const sessionId = req.headers['x-admin-session'];
  if (sessionId) {
    adminSessions.delete(sessionId);
  }
  res.json({ message: 'Logged out' });
};

module.exports = { authMiddleware, login, logout };
