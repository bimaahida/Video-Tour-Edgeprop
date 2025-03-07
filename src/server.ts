import app from './app';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get port from environment or use default
const PORT = process.env.PORT || 3000;

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err);
  console.error(err.stack);
  
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

export default server;