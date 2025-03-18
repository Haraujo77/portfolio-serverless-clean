// Express server for portfolio admin functionality
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { json } = require('express');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Configure Cloudinary (replace with your credentials)
cloudinary.config({
  cloud_name: 'dicwtd4pv',
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Middleware
app.use(express.json());
app.use(express.static('public'));

// File upload storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// File upload middleware
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max size
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads/')) {
  fs.mkdirSync('uploads/');
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint to get all projects
app.get('/api/projects', (req, res) => {
  try {
    const projectsData = fs.readFileSync('js/projects.json', 'utf8');
    const projects = JSON.parse(projectsData);
    res.json(projects);
  } catch (error) {
    console.error('Error reading projects:', error);
    res.status(500).json({ error: 'Failed to read projects data' });
  }
});

// API endpoint to save projects JSON
app.post('/api/projects', (req, res) => {
  try {
    const projects = req.body;
    
    // Validate projects data
    if (!Array.isArray(projects)) {
      return res.status(400).json({ error: 'Projects data must be an array' });
    }
    
    // Create backup of existing file
    if (fs.existsSync('js/projects.json')) {
      fs.copyFileSync(
        'js/projects.json', 
        `js/projects.backup.${Date.now()}.json`
      );
    }
    
    // Save new data
    fs.writeFileSync('js/projects.json', JSON.stringify(projects, null, 2));
    
    res.json({ success: true, message: 'Projects saved successfully' });
  } catch (error) {
    console.error('Error saving projects:', error);
    res.status(500).json({ error: 'Failed to save projects data' });
  }
});

// API endpoint to upload image to Cloudinary
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'portfolio',
      resource_type: 'auto'
    });
    
    // Delete local file after upload
    fs.unlinkSync(req.file.path);
    
    res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    
    // Clean up local file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to upload file to Cloudinary' });
  }
});

// API endpoint to migrate local images to Cloudinary
app.post('/api/migrate-images', async (req, res) => {
  try {
    const { imagePaths } = req.body;
    
    if (!imagePaths || !Array.isArray(imagePaths)) {
      return res.status(400).json({ error: 'Invalid image paths data' });
    }
    
    const results = [];
    
    for (const imagePath of imagePaths) {
      // Skip if already a Cloudinary URL
      if (imagePath.includes('cloudinary.com')) {
        results.push({ 
          originalPath: imagePath, 
          cloudinaryUrl: imagePath,
          status: 'skipped' 
        });
        continue;
      }
      
      // Verify file exists
      const fullPath = path.join(__dirname, imagePath);
      if (!fs.existsSync(fullPath)) {
        results.push({ 
          originalPath: imagePath, 
          status: 'error',
          message: 'File not found' 
        });
        continue;
      }
      
      // Upload to Cloudinary
      try {
        const result = await cloudinary.uploader.upload(fullPath, {
          folder: 'portfolio',
          resource_type: 'auto'
        });
        
        results.push({
          originalPath: imagePath,
          cloudinaryUrl: result.secure_url,
          public_id: result.public_id,
          status: 'success'
        });
      } catch (uploadError) {
        results.push({
          originalPath: imagePath,
          status: 'error',
          message: uploadError.message
        });
      }
    }
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error migrating images:', error);
    res.status(500).json({ error: 'Failed to migrate images' });
  }
});

// API endpoint to save static content
app.post('/api/content/:type', (req, res) => {
  try {
    const { type } = req.params;
    const content = req.body;
    
    // Validate content type
    if (!['intro', 'about'].includes(type)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }
    
    // Create backup of existing file
    if (fs.existsSync(`js/${type}.json`)) {
      fs.copyFileSync(
        `js/${type}.json`, 
        `js/${type}.backup.${Date.now()}.json`
      );
    }
    
    // Save new content
    fs.writeFileSync(`js/${type}.json`, JSON.stringify(content, null, 2));
    
    res.json({ success: true, message: `${type} content saved successfully` });
  } catch (error) {
    console.error(`Error saving ${req.params.type} content:`, error);
    res.status(500).json({ error: `Failed to save ${req.params.type} content` });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});