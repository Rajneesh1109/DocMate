import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const router = Router();

const generateTokens = (userId: string, email: string, name: string) => {
  const accessToken = jwt.sign(
    { userId, email, name },
    process.env.JWT_SECRET || 'your_secret_key_change_me_in_production_12345',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, email, name },
    process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key_change_me_in_production_12345',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields (name, email, password) are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      passwordHash,
    });

    await user.save();

    const { accessToken, refreshToken } = generateTokens(
      user._id.toString(),
      user.email,
      user.name
    );

    return res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('[Auth Register] Error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { accessToken, refreshToken } = generateTokens(
      user._id.toString(),
      user.email,
      user.name
    );

    return res.status(200).json({
      message: 'Login successful.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('[Auth Login] Error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key_change_me_in_production_12345';
    const decoded = jwt.verify(refreshToken, refreshSecret) as { userId: string; email: string; name: string };

    // Issue new tokens
    const tokens = generateTokens(decoded.userId, decoded.email, decoded.name);

    return res.status(200).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }
});

export default router;
