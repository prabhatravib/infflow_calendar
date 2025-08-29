# Calendar Worker Deployment Guide

## Overview
The Calendar Worker is a modern React-based calendar application with weather integration, event management, and multiple view modes.

## Features
- **Multiple Views**: Week, Day, Month, and List views
- **Weather Integration**: Real-time weather data with location input
- **Event Types**: Work, Fun, and Other categories with color coding
- **Event Management**: Create, edit, delete events with modals
- **Responsive Design**: Mobile-friendly interface
- **Weather Warnings**: Bad weather days shown as background events

## Prerequisites
- Node.js 18+ 
- npm or yarn
- A modern web browser

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd calendar-worker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**:
   Create a `.env.local` file in the root directory:
   ```env
   # API Configuration
   VITE_API_BASE_URL=/api
   
   # Weather API (optional - for weather integration)
   VITE_WEATHER_API_ENABLED=true
   ```

## Development

1. **Start development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Build for production**:
   ```bash
   npm run build
   # or
   yarn build
   ```

## Deployment

### Option 1: Static Hosting (Recommended)
The app builds to static files that can be deployed to any static hosting service.

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your preferred hosting service:
   - **Vercel**: Drag and drop the `dist` folder
   - **Netlify**: Drag and drop the `dist` folder
   - **GitHub Pages**: Push the `dist` folder to a `gh-pages` branch
   - **AWS S3**: Upload the `dist` folder contents
   - **Cloudflare Pages**: Connect your repository and set build command to `npm run build`

### Option 2: Docker Deployment
1. **Build Docker image**:
   ```bash
   docker build -t calendar-worker .
   ```

2. **Run container**:
   ```bash
   docker run -p 3000:80 calendar-worker
   ```

### Option 3: Traditional Web Server
1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Copy the `dist` folder** to your web server's document root
3. **Configure your web server** to serve the static files

## API Integration

The calendar worker expects a backend API with the following endpoints:

### Events API
- `GET /api/events` - Fetch events
- `POST /api/events` - Create event
- `PATCH /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Weather API (Optional)
- `GET /api/weather` - Fetch weather data
- `POST /api/weather/location` - Update location
- `POST /api/weather/refresh` - Refresh weather data

## Configuration

### Environment Variables
- `VITE_API_BASE_URL`: Base URL for API calls (default: `/api`)
- `VITE_WEATHER_API_ENABLED`: Enable weather integration (default: `true`)

### Build Configuration
The app uses Vite for building. Configuration can be modified in `vite.config.ts`.

## Troubleshooting

### Common Issues

1. **API Connection Errors**:
   - Verify your API endpoint is accessible
   - Check CORS configuration on your backend
   - Ensure the API base URL is correct

2. **Weather Integration Not Working**:
   - Verify weather API endpoints are available
   - Check if `VITE_WEATHER_API_ENABLED` is set to `true`
   - Ensure your backend supports weather endpoints

3. **Build Failures**:
   - Clear `node_modules` and reinstall dependencies
   - Check Node.js version compatibility
   - Verify all environment variables are set

### Performance Optimization

1. **Code Splitting**: The app automatically code-splits by route
2. **Lazy Loading**: Components are loaded on demand
3. **Image Optimization**: Use WebP format for images when possible
4. **Bundle Analysis**: Run `npm run analyze` to inspect bundle size

## Security Considerations

1. **API Security**: Implement proper authentication for your backend API
2. **Input Validation**: Validate all user inputs on the backend
3. **HTTPS**: Always deploy with HTTPS enabled
4. **CORS**: Configure CORS properly on your backend

## Monitoring and Analytics

1. **Error Tracking**: Consider integrating Sentry or similar error tracking
2. **Performance Monitoring**: Use Lighthouse CI for performance monitoring
3. **User Analytics**: Integrate Google Analytics or similar if needed

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the codebase for configuration examples
3. Open an issue in the repository
4. Check the API documentation for your backend

## License

This project is licensed under the MIT License.
