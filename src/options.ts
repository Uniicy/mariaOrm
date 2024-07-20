export interface FindOptions {
  with?: {
    [relation: string]: boolean;
  };
  limit?: number;
  offset?: number;
}
