import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'acherlab-secret-key-2024';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, plan: user.plan },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.user = verifyToken(header.split(' ')[1]);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function adminOnly(req, res, next) {
  if (req.user.plan !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}
