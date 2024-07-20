# MariaOrm

MariaOrm is a TypeScript-based ORM (Object-Relational Mapping) library for MariaDB. It uses the `mariadb` npm package as a connector and provides excellent type safety and developer experience.

## Features

- Type-safe queries
- One-to-many and many-to-many relationships
- Eager loading of related entities
- Query building with fluent API
- Integration with Jest for testing

## Installation

Install the package using npm or yarn:

```sh
npm install mariadb
npm install mariaOrm
```

## Getting Started

### Setting Up the Database

Create your database tables. For this example, we will create `users`, `roles`, `posts`, and a join table `user_roles` for a many-to-many relationship between `users` and `roles`.

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL
);

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    userId INT,
    FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE user_roles (
    user_id INT,
    role_id INT,
    PRIMARY KEY(user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

### Defining Models

Define your models in TypeScript.

#### `models/User.ts`

```typescript
export interface User {
  id: number;
  name: string;
  email: string;
}
```

#### `models/Role.ts`

```typescript
export interface Role {
  id: number;
  name: string;
}
```

#### `models/Post.ts`

```typescript
export interface Post {
  id: number;
  title: string;
  content: string;
  userId: number;
}
```

### Setting Up the ORM

Configure your ORM and define relations.

#### `src/orm.ts`

```typescript
import ORM from './orm';
import { User } from './models/User';
import { Role } from './models/Role';
import { Post } from './models/Post';

const userORM = new ORM<User>('users', 'test_main');
const postORM = new ORM<Post>('posts', 'test_secondary');
const roleORM = new ORM<Role>('roles', 'test_main');

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

export { userORM, postORM, roleORM };
```

### Using the ORM

Fetch users with related posts and roles.

```typescript
import { userORM } from './orm';

const optionsWithRelations = { with: { posts: true, roles: true } };

async function fetchUsers() {
  const users = await userORM.findAll(optionsWithRelations);
  console.log(users);
}

fetchUsers();
```

### Running Tests

#### `__tests__/integration/ormIntegration.test.ts`

```typescript
import { userORM, postORM, roleORM } from '../../src/orm';
import { User } from '../../src/models/User';
import { Post } from '../../src/models/Post';
import { Role } from '../../src/models/Role';

describe('ORM Integration', () => {
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
```

## Contributing

Feel free to open issues or submit pull requests.

## License

MIT

