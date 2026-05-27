## Prisma Setup

```bash
# Install Prisma CLI as a development dependency
npm install -D prisma

# Install Prisma Client
npm install @prisma/client

# Initialize Prisma in the project (creates prisma/schema.prisma and .env)
npx prisma init

# Generate Prisma Client based on the schema
npx prisma generate

# Reset the database and apply all migrations (Caution: deletes all data)
npx prisma migrate reset 

# Create a new migration and apply it to the database
npx prisma migrate dev --name init
```

## Swagger Setup

```bash
# Install Swagger UI and JSDoc for API documentation
npm install swagger-ui-express swagger-jsdoc
```