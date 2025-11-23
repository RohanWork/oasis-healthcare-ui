# OASIS Home Health Care - Frontend (OASIS-ui)

Multi-tenant OASIS Home Health Care Management System - React Frontend Application

## Technology Stack

- **React 18.2** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **JWT Decode** - JWT token handling
- **React Hook Form** - Form management
- **React Toastify** - Toast notifications
- **Lucide React** - Icon library

## Project Structure

```
OASIS-ui/
├── public/                    # Static assets
├── src/
│   ├── components/            # Reusable components
│   │   └── ProtectedRoute.jsx # Route protection
│   ├── context/               # React Context
│   │   └── AuthContext.jsx    # Authentication context
│   ├── pages/                 # Page components
│   │   ├── Login.jsx          # Login page
│   │   ├── SelectOrganization.jsx # Organization selection
│   │   └── Dashboard.jsx      # Main dashboard
│   ├── services/              # API services
│   │   └── api.js             # Axios configuration
│   ├── App.jsx                # Main app component
│   ├── main.jsx               # Entry point
│   └── index.css              # Global styles
├── index.html                 # HTML template
├── package.json               # Dependencies
└── vite.config.js             # Vite configuration
```

## Features Implemented (Phase 0)

### Authentication & Authorization
- ✅ **Login Page** - Beautiful, modern login interface
- ✅ **Organization Selection** - Multi-tenant organization picker
- ✅ **JWT Token Management** - Automatic token handling
- ✅ **Protected Routes** - Route-level access control
- ✅ **Role-Based UI** - Dynamic UI based on user roles
- ✅ **Auto Logout** - Automatic logout on token expiration

### User Experience
- ✅ **Responsive Design** - Mobile-friendly interface
- ✅ **Modern UI** - Beautiful gradients and animations
- ✅ **Loading States** - Spinner and loading indicators
- ✅ **Error Handling** - User-friendly error messages
- ✅ **Toast Notifications** - Success/error notifications

## Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn

### Installation

1. **Navigate to frontend directory:**
   ```bash
   cd OASIS-ui
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - URL: http://localhost:3000

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Authentication Flow

### 1. Login
- User enters username/email and password
- System validates credentials
- Returns JWT token and user information
- Shows available organizations

### 2. Organization Selection
- User selects an organization to work with
- System generates new token with organization context
- Loads user permissions for that organization
- Redirects to dashboard

### 3. Dashboard
- Shows role-based quick actions
- Displays organization-specific data
- Provides navigation to various modules

## Default Login Credentials

| Username | Password | Role | Organization |
|----------|----------|------|--------------|
| admin | Admin@123 | SYSTEM_ADMIN | All Organizations |
| intake.coordinator | Intake@123 | INTAKE_COORDINATOR | OASIS-NYC-01 |
| rn.johnson | RN@123 | RN | OASIS-NYC-01 |

## API Configuration

The frontend is configured to connect to the backend API at:
- **Development:** http://localhost:8080/api
- **Production:** Configure in `src/services/api.js`

### Proxy Configuration

Vite is configured to proxy API requests:

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    }
  }
}
```

## Component Overview

### AuthContext
Provides authentication state and methods throughout the app:
- `user` - Current user information
- `organizations` - Available organizations
- `selectedOrganization` - Currently selected organization
- `permissions` - User permissions
- `isAuthenticated` - Authentication status
- `login()` - Login method
- `logout()` - Logout method
- `selectOrganization()` - Organization selection method
- `hasPermission()` - Check user permission
- `hasRole()` - Check user role

### ProtectedRoute
Wrapper component for protected routes:
```jsx
<ProtectedRoute requireOrganization={true}>
  <Dashboard />
</ProtectedRoute>
```

### API Service
Centralized API configuration with interceptors:
- Automatic token injection
- Automatic token refresh (coming soon)
- Error handling
- Unauthorized redirect

## Styling

### CSS Variables
The application uses CSS custom properties for theming:

```css
:root {
  --primary-color: #2563eb;
  --primary-dark: #1e40af;
  --secondary-color: #10b981;
  --danger-color: #ef4444;
  --warning-color: #f59e0b;
  --success-color: #10b981;
  /* ... more variables */
}
```

### Utility Classes
Common utility classes are available:
- `.btn`, `.btn-primary`, `.btn-secondary`, etc.
- `.card` - Card container
- `.form-group`, `.form-label`, `.form-input` - Form elements
- `.alert`, `.alert-success`, `.alert-error` - Alerts
- `.spinner` - Loading spinner

## Role-Based Features

The dashboard shows different quick actions based on user roles:

### System Admin / Org Admin
- All features available

### Intake Coordinator
- Patient Intake
- Episode Management

### RN / PT
- OASIS Assessment
- Visit Notes

### Scheduler
- Schedule Visit
- Calendar Management

### Billing Specialist
- Billing & Claims
- Payment Processing

## Responsive Design

The application is fully responsive:
- **Desktop:** Full-featured layout
- **Tablet:** Optimized for touch
- **Mobile:** Simplified, mobile-first design

Breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Guidelines

### Adding New Pages

1. Create component in `src/pages/`
2. Create corresponding CSS file
3. Add route in `App.jsx`
4. Add protection if needed with `ProtectedRoute`

### Adding New API Endpoints

1. Add method to `src/services/api.js`:
```javascript
export const patientAPI = {
  getAll: () => api.get('/patients'),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
};
```

### State Management

Currently using:
- **React Context** for global state (Auth)
- **useState** for local component state
- **localStorage** for persistence

For complex state management in future phases, consider:
- Redux Toolkit
- Zustand
- React Query

## Environment Variables

Create `.env` file for environment-specific configuration:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=OASIS Home Health Care
```

Access in code:
```javascript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

## Performance Optimization

### Current Optimizations
- Vite for fast builds and HMR
- Code splitting with React.lazy (ready for future)
- Optimized images and assets

### Future Optimizations
- React.lazy for route-based code splitting
- Service Worker for offline support
- Image optimization and lazy loading
- Bundle size analysis

## Testing

```bash
# Run tests (to be implemented)
npm test

# Run tests with coverage
npm run test:coverage
```

## Troubleshooting

### Issue: Cannot connect to backend
**Solution:** Ensure backend is running on port 8080

### Issue: CORS errors
**Solution:** Check CORS configuration in backend `SecurityConfig.java`

### Issue: Token expired
**Solution:** Login again. Automatic refresh token handling coming in future phase

### Issue: Port 3000 already in use
**Solution:** Change port in `vite.config.js` or stop the process using port 3000

## Next Steps (Phase 1)

### Patient Management Module
- Patient list page
- Patient details page
- Add/Edit patient form
- Insurance information
- Document upload

### Episode Management Module
- Episode list
- Episode creation
- Episode summary
- Certification periods

## Scripts

```bash
# Development
npm run dev          # Start dev server

# Build
npm run build        # Build for production
npm run preview      # Preview production build

# Linting
npm run lint         # Run ESLint
```

## Contributing

1. Follow React best practices
2. Use functional components with hooks
3. Keep components small and focused
4. Write meaningful component and variable names
5. Add comments for complex logic
6. Test thoroughly before committing

## Support

For issues and questions, please contact the development team.

## License

Proprietary - OASIS Home Health Care System

