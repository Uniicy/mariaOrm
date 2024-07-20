import { Post } from './Post';

export interface User {
  id: number;
  name: string;
  email: string;
  posts?: Post[]; // One-to-many relationship with posts
}
