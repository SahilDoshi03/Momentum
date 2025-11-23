# Momentum Backend

Express.js + MongoDB backend with TypeScript for the Momentum task management application.

## Features

- **Authentication**: JWT-based auth with HTTP-only cookies, Google OAuth support
- **User Management**: User registration, login, profile management
- **Project Management**: Create, update, delete projects with team collaboration
- **Task Management**: Full CRUD operations for tasks, task groups, assignments
- **Team Collaboration**: Team and project member management
- **Labels & Organization**: Project labels with color coding
- **RESTful API**: Clean REST API with proper error handling and validation

## Tech Stack

- **Node.js** with **Express.js**
- **TypeScript** for type safety
- **MongoDB** with **Mongoose** ODM
- **JWT** for authentication
- **Passport.js** for Google OAuth
- **Docker** for containerization
- **bcryptjs** for password hashing
- **express-validator** for input validation

## Quick Start

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- MongoDB (via Docker)

### Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB with Docker:**
   ```bash
   docker-compose up -d mongodb
   ```

4. **Seed the database:**
   ```bash
   npm run seed
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/momentum
DB_NAME=momentum

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Frontend
FRONTEND_URL=http://localhost:3000

# Session
SESSION_SECRET=your-session-secret-here
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/validate` - Validate token
- `GET /api/auth/me` - Get current user
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback

### Users
- `GET /api/users` - List all users (admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin)

### Projects
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Add project member
- `DELETE /api/projects/:id/members/:userId` - Remove member

### Tasks
- `GET /api/tasks/my-tasks` - Get user's tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/assign` - Assign user to task
- `DELETE /api/tasks/:id/assign/:userId` - Unassign user

### Label Colors
- `GET /api/label-colors` - Get available label colors

## Database Schema

### Core Models
- **User**: User accounts with authentication
- **Organization**: Company/organization entities
- **Team**: Teams within organizations
- **Project**: Projects with task groups
- **Task**: Individual tasks with assignments
- **LabelColor**: Available label colors
- **ProjectLabel**: Project-specific labels
- **TaskLabel**: Task-label associations

## Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### Database Seeding

The seed script creates:
- 3 sample users (john_doe, jane_smith, bob_wilson)
- 1 organization and team
- 3 projects (Website Redesign, Mobile App, Personal Tasks)
- Sample tasks with assignments
- Label colors and project labels

**Test credentials:**
- Username: `john_doe`, Password: `password123`
- Username: `jane_smith`, Password: `password123`
- Username: `bob_wilson`, Password: `password123`

## Docker

### Development
```bash
# Start MongoDB only
docker-compose up -d mongodb

# Start full stack (MongoDB + Backend)
docker-compose up
```

### Production
```bash
# Build and start
docker-compose -f docker-compose.prod.yml up --build
```

## Security Features

- **JWT Authentication** with HTTP-only cookies
- **Password Hashing** with bcrypt (12 salt rounds)
- **Rate Limiting** on authentication endpoints
- **CORS** configuration for frontend integration
- **Input Validation** with express-validator
- **Helmet.js** for security headers
- **Role-based Access Control** (owner, admin, member, observer)

## Error Handling

- Centralized error handling middleware
- Structured error responses
- Validation error details
- Development vs production error details

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Configure `MONGODB_URI` for production database
- Set up Google OAuth credentials
- Configure `FRONTEND_URL` for production frontend

### Health Check
- `GET /health` - Server health status

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
