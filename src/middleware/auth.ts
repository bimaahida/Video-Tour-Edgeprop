import { Request, Response, NextFunction } from 'express';
import { edgepropService } from '../services/edgepropService';

import { EdgePropUserInfo, EdgePropPoints } from '../models/edgeprop';

// Extend the Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: EdgePropUserInfo;
      edgepropPoint ?: EdgePropPoints
    }
  }
}

/**
 * Authentication middleware that verifies the EdgeProp session ID
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Get the session ID from the X-Session-ID header
    const sessionId = req.headers['x-session-id'] as string;
    if (!sessionId) {
      return res.status(401).json({ error: 'Missing session ID header' });
    }

    // Verify the session with EdgeProp API
    const userInfo = await edgepropService.getUserInfo(sessionId);

    if (!userInfo.user || !userInfo.user.uid) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }


    const edgepropPoint = await edgepropService.getPoints(userInfo.user.uid);
    if (!edgepropPoint.status) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.user = userInfo;
    req.edgepropPoint = edgepropPoint;

    next();
  } catch (error) {
    console.error('EdgeProp authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}