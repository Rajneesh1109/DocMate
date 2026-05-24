import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import Document from '../models/Document';

export const checkDocumentPermission = (requiredRole: 'owner' | 'editor' | 'viewer') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const docId = req.params.id || req.params.docId;
      if (!docId) {
        return res.status(400).json({ error: 'Document ID is required.' });
      }

      const userId = req.user?.userId;
      const userEmail = req.user?.email;

      if (!userId || !userEmail) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }

      const doc = await Document.findById(docId);
      if (!doc) {
        return res.status(404).json({ error: 'Document not found.' });
      }

      // Check if owner
      const isOwner = doc.owner.toString() === userId.toString();

      if (requiredRole === 'owner') {
        if (!isOwner) {
          return res.status(403).json({ error: 'Only the document owner can perform this action.' });
        }
        return next();
      }

      if (isOwner) {
        // Owner has all permissions (editor & viewer)
        return next();
      }

      // Check if collaborator
      const collaborator = doc.collaborators.find(
        (c) => c.email.toLowerCase() === userEmail.toLowerCase()
      );

      if (!collaborator) {
        return res.status(403).json({ error: 'You do not have access to this document.' });
      }

      if (requiredRole === 'editor' && collaborator.role !== 'editor') {
        return res.status(403).json({ error: 'You do not have write permission (editor role required) for this document.' });
      }

      // If requiredRole is viewer, any collaborator (editor or viewer) has access.
      next();
    } catch (error) {
      console.error('[Permissions Middleware] Error:', error);
      return res.status(500).json({ error: 'Internal server error checking permissions.' });
    }
  };
};
