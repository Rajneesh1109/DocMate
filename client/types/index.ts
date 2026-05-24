export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Collaborator {
  email: string;
  role: 'editor' | 'viewer';
}

export interface DocVersion {
  _id: string;
  title: string;
  content: string;
  savedAt: string;
  savedBy: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface DocumentType {
  _id: string;
  title: string;
  content: string;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  collaborators: Collaborator[];
  versions: DocVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface UserPresence {
  socketId: string;
  userId: string;
  name: string;
  email: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
    selection?: any;
  };
}
