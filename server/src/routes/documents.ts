import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { checkDocumentPermission } from '../middleware/permissions';
import Document from '../models/Document';
import User from '../models/User';

const router = Router();

// Apply authMiddleware to all document routes
router.use(authMiddleware);

// POST /api/docs - Create a new document
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const newDoc = new Document({
      title: title || 'Untitled Document',
      content: '',
      owner: userId,
      collaborators: [],
      versions: []
    });

    await newDoc.save();

    return res.status(201).json(newDoc);
  } catch (error) {
    console.error('[Create Doc] Error:', error);
    return res.status(500).json({ error: 'Internal server error creating document.' });
  }
});

// GET /api/docs - List all documents (owned + collaborated)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const userEmail = req.user?.email;

    if (!userId || !userEmail) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Find documents owned by user OR where user is a collaborator
    const docs = await Document.find({
      $or: [
        { owner: userId },
        { 'collaborators.email': userEmail.toLowerCase() }
      ]
    })
      .populate('owner', 'name email')
      .sort({ updatedAt: -1 });

    return res.status(200).json(docs);
  } catch (error) {
    console.error('[List Docs] Error:', error);
    return res.status(500).json({ error: 'Internal server error fetching documents.' });
  }
});

// GET /api/docs/:id - Get a single document
router.get('/:id', checkDocumentPermission('viewer'), async (req: AuthRequest, res: Response) => {
  try {
    const docId = req.params.id;
    const doc = await Document.findById(docId)
      .populate('owner', 'name email')
      .populate('versions.savedBy', 'name email');

    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    return res.status(200).json(doc);
  } catch (error) {
    console.error('[Get Doc] Error:', error);
    return res.status(500).json({ error: 'Internal server error fetching document.' });
  }
});

// PUT /api/docs/:id - Update document title
router.put('/:id', checkDocumentPermission('editor'), async (req: AuthRequest, res: Response) => {
  try {
    const docId = req.params.id;
    const { title } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Document title cannot be empty.' });
    }

    const doc = await Document.findByIdAndUpdate(
      docId,
      { title: title.trim() },
      { new: true }
    ).populate('owner', 'name email');

    return res.status(200).json(doc);
  } catch (error) {
    console.error('[Update Doc Title] Error:', error);
    return res.status(500).json({ error: 'Internal server error updating document title.' });
  }
});

// DELETE /api/docs/:id - Delete document (Owner only)
router.delete('/:id', checkDocumentPermission('owner'), async (req: AuthRequest, res: Response) => {
  try {
    const docId = req.params.id;
    await Document.findByIdAndDelete(docId);
    return res.status(200).json({ message: 'Document deleted successfully.' });
  } catch (error) {
    console.error('[Delete Doc] Error:', error);
    return res.status(500).json({ error: 'Internal server error deleting document.' });
  }
});

// POST /api/docs/:id/share - Share document with collaborator
router.post('/:id/share', checkDocumentPermission('editor'), async (req: AuthRequest, res: Response) => {
  try {
    const docId = req.params.id;
    const { email, role } = req.body;

    if (!email || !role || !['editor', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Valid email and role (editor/viewer) are required.' });
    }

    const doc = await Document.findById(docId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    // Check if sharing with owner
    const ownerUser = await User.findById(doc.owner);
    if (ownerUser && ownerUser.email.toLowerCase() === email.toLowerCase()) {
      return res.status(400).json({ error: 'Cannot share a document with its owner.' });
    }

    // Check if collaborator already exists
    const existingIndex = doc.collaborators.findIndex(
      (c) => c.email.toLowerCase() === email.toLowerCase()
    );

    if (existingIndex > -1) {
      // Update role
      doc.collaborators[existingIndex].role = role;
    } else {
      // Add new collaborator
      doc.collaborators.push({ email: email.toLowerCase(), role });
    }

    await doc.save();

    return res.status(200).json({
      message: 'Collaborator added/updated successfully.',
      collaborators: doc.collaborators
    });
  } catch (error) {
    console.error('[Share Doc] Error:', error);
    return res.status(500).json({ error: 'Internal server error sharing document.' });
  }
});

// GET /api/docs/:id/versions - List all versions of a document
router.get('/:id/versions', checkDocumentPermission('viewer'), async (req: AuthRequest, res: Response) => {
  try {
    const docId = req.params.id;
    const doc = await Document.findById(docId).populate('versions.savedBy', 'name email');
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    return res.status(200).json(doc.versions);
  } catch (error) {
    console.error('[Get Versions] Error:', error);
    return res.status(500).json({ error: 'Internal server error fetching versions.' });
  }
});

// GET /api/docs/:id/versions/:versionId - Get specific version details
router.get('/:id/versions/:versionId', checkDocumentPermission('viewer'), async (req: AuthRequest, res: Response) => {
  try {
    const { id: docId, versionId } = req.params;
    const doc = await Document.findById(docId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const version = doc.versions.find((v) => v._id?.toString() === versionId);
    if (!version) {
      return res.status(404).json({ error: 'Version not found.' });
    }

    return res.status(200).json(version);
  } catch (error) {
    console.error('[Get Version Details] Error:', error);
    return res.status(500).json({ error: 'Internal server error fetching version detail.' });
  }
});

// POST /api/docs/:id/versions/:versionId/restore - Restore specific version
router.post('/:id/versions/:versionId/restore', checkDocumentPermission('editor'), async (req: AuthRequest, res: Response) => {
  try {
    const { id: docId, versionId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const doc = await Document.findById(docId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const version = doc.versions.find((v) => v._id?.toString() === versionId);
    if (!version) {
      return res.status(404).json({ error: 'Version not found.' });
    }

    // Save a backup of the current content before restoring
    doc.versions.push({
      title: `Pre-restore: ${doc.title}`,
      content: doc.content,
      savedAt: new Date(),
      savedBy: userId
    });

    // Restore content and title
    doc.title = version.title;
    doc.content = version.content;

    await doc.save();

    return res.status(200).json({
      message: 'Document restored successfully.',
      doc
    });
  } catch (error) {
    console.error('[Restore Version] Error:', error);
    return res.status(500).json({ error: 'Internal server error restoring version.' });
  }
});

export default router;
