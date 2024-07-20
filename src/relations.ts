export interface Relation<T, R> {
  type: 'one-to-many' | 'many-to-one' | 'many-to-many';
  relatedOrm: any; // ORM instance
  foreignKey: keyof R;
  primaryKey?: keyof T;
  joinTable?: string;
  joinForeignKey?: string;
}

export interface FindOptions {
  with?: {
    [relation: string]: boolean;
  };
}
