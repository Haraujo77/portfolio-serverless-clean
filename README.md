# Portfolio Serverless (Clean Version)

A modern, responsive portfolio website with dynamic content loading and Cloudinary integration as CDN.

## Features

- **Fully Responsive Design**: Optimized for all device sizes
- **Dynamic Content Loading**: Projects loaded from JSON data
- **Cloudinary Integration**: All media assets served through Cloudinary CDN
- **Dark/Light Mode**: Dynamic theme switching
- **Interactive Carousel**: Interactive navigation for projects
- **Serverless Architecture**: Static files only, can be hosted anywhere

## Technology Stack

- HTML5
- CSS3 (with CSS Variables)
- Vanilla JavaScript (ES6+)
- Cloudinary for CDN media storage
- Express.js (for local development server)

## Project Structure

```
portfolio-serverless-clean/
├── css/
│   └── styles.css     # Main CSS file with responsive design
├── js/
│   ├── main.js        # Core application logic
│   └── projects.json  # Project data
├── img/               # Local images (most images served via Cloudinary)
├── index.html         # Main entry point
├── package.json       # Dependencies and scripts
└── serve.js           # Simple Express server for local development
```

## Cloudinary Integration

This version integrates Cloudinary as a CDN for serving all media assets. The application:

1. Automatically converts local image/video paths to Cloudinary URLs
2. Provides fallback for missing assets 
3. Handles different media types (images, videos, JSON animations)
4. Uses versioning for cache control

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm start
   ```
4. Open your browser to `http://localhost:3000`

## Deployment

This project can be deployed to any static hosting service like GitHub Pages, Netlify, Vercel, or S3.

## License

MIT