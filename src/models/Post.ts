import { User } from './User';

export interface Post {
  id: number;
  title: string;
  content: string;
  userId: number;
  user?: User; // Many-to-one relationship with user
}
