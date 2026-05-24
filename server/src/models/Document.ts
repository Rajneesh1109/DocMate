import { Schema, model, Document as MongooseDocument } from 'mongoose';

export interface IDocVersion {
  _id?: string;
  title: string;
  content: string; // Snapshot text / HTML / state
  savedAt: Date;
  savedBy: Schema.Types.ObjectId | string;
}

export interface IDocCollaborator {
  email: string;
  role: 'editor' | 'viewer';
}

export interface IDocument extends MongooseDocument {
  title: string;
  content: string;
  owner: Schema.Types.ObjectId | string;
  collaborators: IDocCollaborator[];
  versions: IDocVersion[];
  createdAt: Date;
  updatedAt: Date;
}

const DocVersionSchema = new Schema<IDocVersion>({
  title: { type: String, required: true },
  content: { type: String, default: '' },
  savedAt: { type: Date, default: Date.now },
  savedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

const DocCollaboratorSchema = new Schema<IDocCollaborator>({
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ['editor', 'viewer'], default: 'editor' }
}, { _id: false });

const DocumentSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true, default: 'Untitled Document', trim: true },
    content: { type: String, default: '' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    collaborators: [DocCollaboratorSchema],
    versions: [DocVersionSchema]
  },
  {
    timestamps: true
  }
);

export const Document = model<IDocument>('Document', DocumentSchema);
export default Document;
