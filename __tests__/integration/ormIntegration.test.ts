import ORM from '../../src/orm';
import { User } from '../../src/models/User';
import { Post } from '../../src/models/Post';
import { Role } from '../../src/models/Role';
import QueryBuilder from '../../src/queryBuilder';

describe('ORM Integration', () => {
  let userORM: ORM<User>;
  let postORM: ORM<Post>;
  let roleORM: ORM<Role>;

  beforeAll(() => {
    userORM = new ORM<User>('users', 'test_main');
    postORM = new ORM<Post>('posts', 'test_secondary');
    roleORM = new ORM<Role>('roles', 'test_main');
    userORM.addRelation('posts', {
      type: 'one-to-many',
      relatedOrm: postORM,
      foreignKey: 'userId',
    });

    userORM.addRelation('roles', {
      type: 'many-to-many',
      relatedOrm: roleORM,
      foreignKey: 'role_id',
      joinTable: 'user_roles',
      joinForeignKey: 'user_id',
    });

    roleORM.addRelation('users', {
      type: 'many-to-many',
      relatedOrm: userORM,
      foreignKey: 'user_id',
      joinTable: 'user_roles',
      joinForeignKey: 'role_id',
    });
  });

  it('should fetch users without related posts', async () => {
    const users = await userORM.findAll();

    expect(users).toEqual([
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
    ]);
  });

  it('should fetch users with related posts', async () => {
    const optionsWithRelations = { with: { posts: true } };
    const users = await userORM.findAll(optionsWithRelations);

    expect(users).toEqual([
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        posts: [
          {
            id: 1,
            title: 'First Post',
            content: 'Content of post 1',
            userId: 1,
          },
        ],
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        posts: [],
      },
    ]);
  });

  it('should fetch posts', async () => {
    const posts = await postORM.findAll();

    expect(posts).toEqual([
      {
        id: 1,
        title: 'First Post',
        content: 'Content of post 1',
        userId: 1,
      },
    ]);
  });

  it('should find a user by ID without related posts', async () => {
    const user = await userORM.findById(1);

    expect(user).toEqual({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    });
  });

  it('should find a user by ID with related posts', async () => {
    const optionsWithRelations = { with: { posts: true } };
    const user = await userORM.findById(1, optionsWithRelations);

    expect(user).toEqual({
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      posts: [
        {
          id: 1,
          title: 'First Post',
          content: 'Content of post 1',
          userId: 1,
        },
      ],
    });
  });

  it('should handle finding a non-existent user by ID', async () => {
    const user = await userORM.findById(999);

    expect(user).toBeUndefined();
  });

  it('should find users with a specific condition', async () => {
    const queryBuilder = new QueryBuilder<User>('users');
    queryBuilder.where('name', '=', 'John Doe');
    const users = await userORM.find(queryBuilder);

    expect(users).toEqual([
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      },
    ]);
  });

  it('should find posts with a specific condition', async () => {
    const queryBuilder = new QueryBuilder<Post>('posts');
    queryBuilder.where('title', '=', 'First Post');
    const posts = await postORM.find(queryBuilder);

    expect(posts).toEqual([
      {
        id: 1,
        title: 'First Post',
        content: 'Content of post 1',
        userId: 1,
      },
    ]);
  });

  it('should handle finding no users with a specific condition', async () => {
    const queryBuilder = new QueryBuilder<User>('users');
    queryBuilder.where('name', '=', 'Non-existent User');
    const users = await userORM.find(queryBuilder);

    expect(users).toEqual([]);
  });
  it('should fetch users with related roles', async () => {
    const optionsWithRelations = { with: { roles: true } };
    const users = await userORM.findAll(optionsWithRelations);

    expect(users).toEqual([
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        roles: [
          {
            id: 1,
            name: 'Admin',
          },
        ],
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        roles: [],
      },
    ]);
  });
  it('should fetch roles with related users', async () => {
    const optionsWithRelations = { with: { users: true } };
    const roles = await roleORM.findAll(optionsWithRelations);
    expect(roles).toEqual([
      {
        id: 1,
        name: 'Admin',
        users: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
          },
        ],
      },
    ]);
  });
});
