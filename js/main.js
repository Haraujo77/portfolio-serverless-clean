// Main.js - Dynamic Portfolio Renderer with Carousel
(async function () {
  console.log('Starting main.js - SERVERLESS VERSION');

  // Wait for DOM to be fully loaded before proceeding
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve);
    });
  }
  
  console.log('DOM fully loaded, initializing elements');
  
  // Initialize DOM elements first
  const carouselMenu = document.getElementById("carouselMenu");
  const carouselTrack = document.getElementById("carouselTrack");
  const carouselContainer = document.getElementById("carouselContainer");
  const sectionsContainer = document.getElementById("sectionsContainer");
  const themeIconImg = document.getElementById("themeIconImg");
  const themeToggleIcon = document.getElementById("themeToggleIcon");
  const helderIconVideo = document.getElementById("helderIconVideo");
  
  // Check if critical elements exist
  if (!carouselTrack || !sectionsContainer) {
    console.error('Critical DOM elements not found!', {
      carouselTrack: !!carouselTrack,
      sectionsContainer: !!sectionsContainer
    });
    document.body.innerHTML = `
      <div style="padding: 50px; color: red; font-family: sans-serif;">
        <h1>Error: Missing required DOM elements</h1>
        <p>The portfolio couldn't load because some required elements were not found in the HTML.</p>
        <p>Please check the browser console for more details.</p>
      </div>
    `;
    return;
  }

  // Global Cloudinary configuration
  const cloudName = 'dicwtd4pv'; // Replace with your cloud name
  const placeholderUrl = 'https://res.cloudinary.com/dicwtd4pv/image/upload/v1742144110/portfolio/placeholder_pkmwq9.jpg';
  
  // Helper function to handle image loading errors
  function setupImageErrorHandling() {
    // Use event delegation for efficiency
    document.addEventListener('error', function(e) {
      const target = e.target;
      // Only handle errors for images and videos
      if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
        console.warn('Media failed to load, replacing with placeholder:', target.src);
        if (target.src.includes('cloudinary.com')) {
          // Replace with placeholder
          target.src = placeholderUrl;
          // Add class to show it's a placeholder
          target.classList.add('placeholder-image');
        }
      }
    }, true); // Use capture phase to get all errors
    
    console.log('Image error handling set up with placeholder:', placeholderUrl);
  }
  
  // Set up error handling for images as early as possible
  setupImageErrorHandling();

  // Function to fetch projects data from local JSON files instead of API
  async function fetchProjectsData() {
    try {
      console.log('Fetching projects from local JSON file');
      const response = await fetch('js/projects.json');
      if (!response.ok) {
        throw new Error(`Failed to load projects: ${response.status}`);
      }
      const data = await response.json();
      console.log('Successfully loaded projects:', data.length, 'projects');
      
      data.forEach(project => {
        // Ensure icon has a valid URL
        if (!project.icon || project.icon.includes('undefined')) {
          project.icon = placeholderUrl;
        } else if (project.icon.startsWith('/img/') || project.icon.startsWith('img/')) {
          // Convert local path to Cloudinary URL if not already a Cloudinary URL
          if (!project.icon.includes('cloudinary.com')) {
            // Extract filename from path
            const filename = project.icon.split('/').pop();
            // Use folder structure from local path
            // Handle paths with or without leading slash
            const folderPath = project.icon.replace(/^\/?img\//, '').split('/').slice(0, -1).join('/');
            project.icon = `https://res.cloudinary.com/${cloudName}/image/upload/v1/portfolio/${folderPath}/${filename}`;
          }
        }
        
        // Process media items
        if (project.media && Array.isArray(project.media)) {
          project.media.forEach(media => {
            // Ensure media src has a valid URL
            if (!media.src || media.src.includes('undefined')) {
              media.src = placeholderUrl;
            } else if (media.src.startsWith('/img/')) {
              // Convert local path to Cloudinary URL if not already a Cloudinary URL
              if (!media.src.includes('cloudinary.com')) {
                // Extract filename from path
                const filename = media.src.split('/').pop();
                // Use folder structure from local path
                const folderPath = media.src.replace('/img/', '').split('/').slice(0, -1).join('/');
                
                // Determine resource type based on extension
                let resourceType = 'image';
                const ext = filename.split('.').pop().toLowerCase();
                if (['mp4', 'mov', 'webm'].includes(ext)) {
                  resourceType = 'video';
                } else if (ext === 'json') {
                  // Special handling for JSON files (like Lottie animations)
                  // JSON files should be uploaded to Cloudinary as "raw" files
                  media.src = `https://res.cloudinary.com/${cloudName}/raw/upload/v1/portfolio/${folderPath}/${filename}`;
                  // Skip the regular URL construction below
                  return;
                }
                
                media.src = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/v1/portfolio/${folderPath}/${filename}`;
              }
            }
          });
        }
      });
      
      return data;
    } catch (error) {
      console.warn('Error loading projects, using sample data:', error.message);
      // Hardcoded sample data for testing or if projects.json doesn't exist yet
      return [
        {
          id: 1,
          name: "Sample Project",
          category: "Demo",
          year: 2024,
          icon: "/img/icon_sample.svg", 
          description: "This is a sample project to demonstrate the portfolio functionality.",
          why: "To showcase the portfolio's capabilities without requiring API access.",
          how: "By providing hardcoded data that mimics the structure of real projects.",
          context: "Used when API endpoints are not available.",
          team: "Solo project",
          role: "Developer",
          hidden: 0,
          media: [
            { type: "image", src: "/img/icon_sample.svg", alt: "Sample", class: "first-image" }
          ],
          order_position: 0
        },
        {
          id: 2,
          name: "Another Project",
          category: "Sample",
          year: 2023,
          icon: "/img/icon_another.svg",
          description: "Another sample project for testing.",
          why: "To demonstrate multiple projects in the portfolio.",
          how: "Using the same pattern as the first project.",
          context: "Sample context for demonstration.",
          team: "Demo team",
          role: "Designer",
          hidden: 0,
          media: [
            { type: "image", src: "/img/icon_another.svg", alt: "Another Sample", class: "first-image" }
          ],
          order_position: 1
        }
      ];
    }
  }

  // Main function to initialize and render portfolio
  async function initPortfolio() {
    console.log('Initializing portfolio application...');
    
    try {
      // Initial theme setup
      setupDarkMode();
      
      // Load projects data from JSON file
      const projects = await fetchProjectsData();
      
      if (!projects || projects.length === 0) {
        throw new Error('No projects loaded');
      }
      
      console.log(`Loaded ${projects.length} projects successfully`);
      
      // Load intro and about content
      await loadStaticContent();
      
      // Render carousel with project icons
      renderCarousel(projects);
      
      // Render all project sections
      renderSections(projects);
      
      // Initialize interactions and listeners
      initializeInteractions(projects);
      
      // Final setup once everything is loaded
      carouselMenu.classList.add('loaded');
      sectionsContainer.classList.add('loaded');
      console.log('Portfolio initialized successfully!');
      
    } catch (error) {
      console.error('Portfolio initialization failed:', error);
      document.body.innerHTML = `
        <div style="padding: 50px; color: red; font-family: sans-serif;">
          <h1>Error: Failed to load portfolio</h1>
          <p>${error.message}</p>
          <p>Please check the browser console for more details.</p>
        </div>
      `;
    }
  }
  
  // Theme setup and management
  function setupDarkMode() {
    // Set initial theme based on user preference
    const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('theme');
    
    // Apply theme from saved preference or system preference
    if (savedTheme === 'dark' || (savedTheme !== 'light' && prefersDarkMode)) {
      document.body.classList.add('dark');
      themeIconImg.src = 'https://res.cloudinary.com/dicwtd4pv/image/upload/v1/portfolio/theme-light.svg';
      themeIconImg.alt = 'Switch to Light Mode';
    } else {
      document.body.classList.remove('dark');
      themeIconImg.src = 'https://res.cloudinary.com/dicwtd4pv/image/upload/v1/portfolio/theme-dark.svg';
      themeIconImg.alt = 'Switch to Dark Mode';
    }
    
    // Theme toggle click handler
    themeToggleIcon.addEventListener('click', function() {
      // Toggle theme
      document.body.classList.toggle('dark');
      const isDark = document.body.classList.contains('dark');
      
      // Update toggle icon
      if (isDark) {
        themeIconImg.src = 'https://res.cloudinary.com/dicwtd4pv/image/upload/v1/portfolio/theme-light.svg';
        themeIconImg.alt = 'Switch to Light Mode';
      } else {
        themeIconImg.src = 'https://res.cloudinary.com/dicwtd4pv/image/upload/v1/portfolio/theme-dark.svg';
        themeIconImg.alt = 'Switch to Dark Mode';  
      }
      
      // Save preference
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
    
    // Make theme toggle visible after setup
    themeToggleIcon.style.opacity = 1;
  }

  // Function to load static content from the server
  async function loadStaticContent() {
    try {
      // Fetch static content
      const response = await fetch('js/static.json');
      
      if (!response.ok) {
        throw new Error(`Failed to load static content: ${response.status}`);
      }
      
      const staticContent = await response.json();
      
      // Populate intro paragraphs
      const introPara1 = document.querySelector('.intro-para-1');
      const introPara2 = document.querySelector('.intro-para-2');
      
      if (introPara1 && staticContent.intro && staticContent.intro.para1) {
        introPara1.innerHTML = staticContent.intro.para1;
      } else {
        introPara1.innerHTML = `<strong>Hello!</strong> I'm Helder, a product designer with over 20 years of experience at the intersection of branding and UX/UI. I help founders and companies bring new ideas to life with a focus on usability, visual design, and meaningful interactions.`;
      }
      
      if (introPara2 && staticContent.intro && staticContent.intro.para2) {
        introPara2.innerHTML = staticContent.intro.para2;
      } else {
        introPara2.innerHTML = `I've worked with startups and established companies across healthcare, education, and consumer products. Scroll down to see selected projects or <a href="mailto:hello@helder.design">contact me</a> to discuss your next project.`;
      }
      
      // Populate about paragraphs  
      const aboutPara1 = document.querySelector('.about-para-1');
      const aboutPara2 = document.querySelector('.about-para-2');
      
      if (aboutPara1 && staticContent.about && staticContent.about.para1) {
        aboutPara1.innerHTML = staticContent.about.para1;
      } else {
        aboutPara1.innerHTML = `<strong>My approach</strong> blends strategic thinking with a keen eye for aesthetics and usability. I believe great products solve real problems in ways that feel intuitive and delightful. My process focuses on understanding user needs, business goals, and technical constraints to create solutions that work on all levels.`;
      }
      
      if (aboutPara2 && staticContent.about && staticContent.about.para2) {
        aboutPara2.innerHTML = staticContent.about.para2;
      } else {
        aboutPara2.innerHTML = `I'm currently available for new projects and collaborations. If you'd like to work together, please reach out at <a href="mailto:hello@helder.design">hello@helder.design</a> or connect with me on <a href="https://www.linkedin.com/in/helderaraujo/" target="_blank">LinkedIn</a>.`;
      }
      
      // Set up the top-left icon/logo
      setupHelderIcon(staticContent);
      
    } catch (error) {
      console.warn('Error loading static content, using defaults:', error.message);
      // Set default content if fetch fails
      document.querySelector('.intro-para-1').innerHTML = `<strong>Hello!</strong> I'm Helder, a product designer with over 20 years of experience at the intersection of branding and UX/UI. I help founders and companies bring new ideas to life with a focus on usability, visual design, and meaningful interactions.`;
      document.querySelector('.intro-para-2').innerHTML = `I've worked with startups and established companies across healthcare, education, and consumer products. Scroll down to see selected projects or <a href="mailto:hello@helder.design">contact me</a> to discuss your next project.`;
      document.querySelector('.about-para-1').innerHTML = `<strong>My approach</strong> blends strategic thinking with a keen eye for aesthetics and usability. I believe great products solve real problems in ways that feel intuitive and delightful. My process focuses on understanding user needs, business goals, and technical constraints to create solutions that work on all levels.`;
      document.querySelector('.about-para-2').innerHTML = `I'm currently available for new projects and collaborations. If you'd like to work together, please reach out at <a href="mailto:hello@helder.design">hello@helder.design</a> or connect with me on <a href="https://www.linkedin.com/in/helderaraujo/" target="_blank">LinkedIn</a>.`;
      
      // Set up default top-left icon
      setupHelderIcon();
    }
  }
  
  // Setup the top-left personal icon/logo
  function setupHelderIcon(staticContent) {
    if (helderIconVideo) {
      try {
        const videoUrl = 'https://res.cloudinary.com/dicwtd4pv/video/upload/v1/portfolio/helder-logo-animation.mp4';
        helderIconVideo.src = videoUrl;
        helderIconVideo.style.opacity = 1;
        
        // Add click handler to return to top
        const helderIconContainer = document.getElementById('helderIconContainer');
        if (helderIconContainer) {
          helderIconContainer.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
        }
      } catch (error) {
        console.warn('Error setting up Helder icon:', error);
      }
    }
  }

  // Render the carousel with project icons
  function renderCarousel(projects) {
    // Clear existing content
    carouselTrack.innerHTML = '';
    
    // Calculate positioning variables
    const radius = 500; // in px, determines the size of the carousel
    const totalProjects = projects.length;
    const angleStep = (2 * Math.PI) / totalProjects;
    
    // Sort projects by order_position
    const sortedProjects = [...projects].sort((a, b) => {
      return (a.order_position || 0) - (b.order_position || 0);
    });
    
    // Create an icon for each project
    sortedProjects.forEach((project, index) => {
      // Skip if project is marked as hidden
      if (project.hidden === 1) return;
      
      // Calculate position on the circle
      const angle = angleStep * index;
      const x = Math.sin(angle) * radius;
      const y = Math.cos(angle) * radius;
      const z = 0;
      
      // Create icon element
      const icon = document.createElement('div');
      icon.className = 'icon intro-size';
      icon.id = `icon-${project.id}`;
      icon.dataset.projectId = project.id;
      icon.dataset.angle = angle;
      
      // Position the icon on the carousel
      icon.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px)`;
      
      // Create icon image
      const img = document.createElement('img');
      img.className = 'icon-img';
      
      // Use Cloudinary URL if available, or convert local path
      if (project.icon && project.icon.includes('cloudinary.com')) {
        img.src = project.icon;
      } else if (project.icon) {
        // Extract filename from path
        const filename = project.icon.split('/').pop();
        img.src = `https://res.cloudinary.com/${cloudName}/image/upload/v1/portfolio/${filename}`;
      } else {
        img.src = placeholderUrl;
      }
      
      img.alt = project.name;
      icon.appendChild(img);
      
      // Create caption
      const caption = document.createElement('div');
      caption.className = 'icon-caption desktop-position';
      caption.innerHTML = `
        <p><strong>${project.name}</strong></p>
        <p>${project.category} &middot; ${project.year}</p>
      `;
      icon.appendChild(caption);
      
      // Add to carousel
      carouselTrack.appendChild(icon);
      
      // Add click event to navigate to project section
      icon.addEventListener('click', () => navigateToProject(project.id));
    });
  }
  
  // Render individual project sections
  function renderSections(projects) {
    // Clear existing sections
    sectionsContainer.innerHTML = '';
    
    // Sort projects by order_position
    const sortedProjects = [...projects].sort((a, b) => {
      return (a.order_position || 0) - (b.order_position || 0);
    });
    
    // Create section for each project
    sortedProjects.forEach((project, index) => {
      // Skip if project is marked as hidden
      if (project.hidden === 1) return;
      
      // Create section container
      const section = document.createElement('div');
      section.className = 'section';
      section.id = `section-${project.id}`;
      section.dataset.projectId = project.id;
      
      // Create section grid
      const sectionGrid = document.createElement('div');
      sectionGrid.className = 'section-grid';
      
      // Project title and info
      const titleInfo = document.createElement('p');
      titleInfo.className = 'section-title-info';
      titleInfo.innerHTML = `<strong>${project.name}</strong><br>${project.category} &middot; ${project.year}`;
      sectionGrid.appendChild(titleInfo);
      
      // Project description, broken into multiple paragraphs
      const description = document.createElement('p');
      description.className = 'section-description';
      description.innerHTML = `<strong>${project.name}</strong> ${project.description}`;
      sectionGrid.appendChild(description);
      
      // Optional "Why" paragraph
      if (project.why) {
        const why = document.createElement('p');
        why.className = 'section-why';
        why.innerHTML = project.why;
        sectionGrid.appendChild(why);
      }
      
      // Optional "How" paragraph
      if (project.how) {
        const how = document.createElement('p');
        how.className = 'section-how';
        how.innerHTML = project.how;
        sectionGrid.appendChild(how);
      }
      
      // Optional context & role info
      if (project.context || project.team || project.role) {
        const contextRole = document.createElement('p');
        contextRole.className = 'section-context-role';
        contextRole.innerHTML = '';
        
        if (project.context) contextRole.innerHTML += `${project.context}<br>`;
        if (project.team) contextRole.innerHTML += `${project.team}<br>`;
        if (project.role) contextRole.innerHTML += `${project.role}`;
        
        sectionGrid.appendChild(contextRole);
      }
      
      // Add media items if available
      if (project.media && Array.isArray(project.media)) {
        project.media.forEach(media => {
          const mediaElement = createMediaElement(media);
          if (mediaElement) {
            sectionGrid.appendChild(mediaElement);
          }
        });
      }
      
      // Add the grid to the section
      section.appendChild(sectionGrid);
      
      // Add the section to the container
      sectionsContainer.appendChild(section);
    });
  }
  
  // Function to create media elements (images, videos, etc.)
  function createMediaElement(media) {
    if (!media || !media.src) return null;
    
    let element = null;
    
    // Handle different media types
    switch (media.type) {
      case 'video':
        element = document.createElement('video');
        element.controls = media.controls !== false;
        element.autoplay = media.autoplay === true;
        element.loop = media.loop !== false;
        element.muted = media.muted !== false;
        element.playsinline = true;
        
        // Convert to Cloudinary URL if needed
        if (!media.src.includes('cloudinary.com') && media.src.startsWith('/img/')) {
          const filename = media.src.split('/').pop();
          const folderPath = media.src.replace('/img/', '').split('/').slice(0, -1).join('/');
          media.src = `https://res.cloudinary.com/${cloudName}/video/upload/v1/portfolio/${folderPath}/${filename}`;
        }
        
        element.src = media.src;
        break;
        
      case 'lottie':
        // Create container for Lottie animation
        element = document.createElement('div');
        element.className = 'lottie-container ' + (media.class || '');
        element.id = `lottie-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // We'll initialize the Lottie animation after the element is added to DOM
        setTimeout(() => {
          const preserveAspect = media['data-preserve-aspect'] || 'xMidYMid meet';
          
          // Load animation from Cloudinary URL
          try {
            fetch(media.src)
              .then(response => response.json())
              .then(animationData => {
                lottie.loadAnimation({
                  container: element,
                  renderer: 'svg',
                  loop: true,
                  autoplay: true,
                  animationData: animationData,
                  rendererSettings: {
                    preserveAspectRatio: preserveAspect
                  }
                });
              })
              .catch(error => {
                console.error('Error loading Lottie animation:', error);
                // Replace with placeholder on error
                element.style.backgroundImage = `url(${placeholderUrl})`;
                element.style.backgroundSize = 'cover';
                element.style.backgroundPosition = 'center';
              });
          } catch (error) {
            console.error('Error setting up Lottie animation:', error);
          }
        }, 100);
        
        // Apply any custom styles from the media object
        if (media.style) {
          Object.keys(media.style).forEach(key => {
            element.style[key] = media.style[key];
          });
        }
        break;
        
      case 'image':
      default:
        element = document.createElement('img');
        
        // Convert to Cloudinary URL if needed
        if (!media.src.includes('cloudinary.com') && media.src.startsWith('/img/')) {
          const filename = media.src.split('/').pop();
          const folderPath = media.src.replace('/img/', '').split('/').slice(0, -1).join('/');
          media.src = `https://res.cloudinary.com/${cloudName}/image/upload/v1/portfolio/${folderPath}/${filename}`;
        }
        
        element.src = media.src;
        element.alt = media.alt || '';
        
        // Add loading strategy
        element.loading = 'lazy';
    }
    
    // Apply common properties
    if (element) {
      element.className = media.class || '';
      
      // Add data attributes
      if (media.dataset) {
        Object.keys(media.dataset).forEach(key => {
          element.dataset[key] = media.dataset[key];
        });
      }
    }
    
    return element;
  }
  
  // Initialize interactive elements and event listeners
  function initializeInteractions(projects) {
    // Capture all icon elements
    const icons = document.querySelectorAll('.icon');
    
    // Show caption on hover for desktop
    icons.forEach(icon => {
      const caption = icon.querySelector('.icon-caption');
      
      icon.addEventListener('mouseenter', () => {
        if (caption) caption.style.opacity = 1;
      });
      
      icon.addEventListener('mouseleave', () => {
        if (caption) caption.style.opacity = 0;
      });
    });
    
    // Capture scroll events to control carousel
    window.addEventListener('scroll', () => {
      // Determine active section based on scroll position
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const introHeight = windowHeight;
      
      // Handle the intro/carousel view transition
      if (scrollPosition < introHeight * 0.5) {
        // In intro section - carousel should be centered
        carouselMenu.classList.add('intro');
      } else {
        // Scrolled past intro - shrink carousel to corner
        carouselMenu.classList.remove('intro');
        
        // Make icons smaller when not in intro mode
        icons.forEach(icon => {
          icon.classList.remove('intro-size');
        });
        
        // Find which section is currently visible
        let activeProjectId = null;
        document.querySelectorAll('.section').forEach(section => {
          const rect = section.getBoundingClientRect();
          if (rect.top < windowHeight * 0.7 && rect.bottom > 0) {
            activeProjectId = section.dataset.projectId;
          }
        });
        
        // Update active icon in carousel
        if (activeProjectId) {
          updateCarouselRotation(activeProjectId);
        }
      }
    });
    
    // Initialize mobile-specific interactions
    initializeMobileInteractions();
  }
  
  // Mobile-specific interaction setup
  function initializeMobileInteractions() {
    // Check if we're on a mobile device
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // Adjust caption positions for mobile
      document.querySelectorAll('.icon-caption').forEach(caption => {
        caption.classList.remove('desktop-position');
        caption.classList.add('mobile-position');
      });
      
      // Add swipe functionality to carousel on mobile
      let touchStartX = 0;
      let touchEndX = 0;
      
      carouselContainer.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
      }, false);
      
      carouselContainer.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, false);
      
      // Handle swipe direction and navigate accordingly
      function handleSwipe() {
        const swipeThreshold = 50;
        if (touchEndX < touchStartX - swipeThreshold) {
          // Swipe left - next project
          navigateToNextProject();
        }
        
        if (touchEndX > touchStartX + swipeThreshold) {
          // Swipe right - previous project
          navigateToPreviousProject();
        }
      }
    }
  }
  
  // Function to navigate to a specific project section
  function navigateToProject(projectId) {
    const targetSection = document.getElementById(`section-${projectId}`);
    if (targetSection) {
      const headerOffset = 100; // Offset for fixed header
      const sectionPosition = targetSection.getBoundingClientRect().top;
      const offsetPosition = sectionPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
  
  // Function to navigate to the next project
  function navigateToNextProject() {
    const icons = Array.from(document.querySelectorAll('.icon'));
    // Skip hidden projects
    const visibleIcons = icons.filter(icon => {
      const section = document.getElementById(`section-${icon.dataset.projectId}`);
      return section !== null;
    });
    
    // Find current active project
    let activeIndex = -1;
    visibleIcons.forEach((icon, index) => {
      if (icon.classList.contains('active')) {
        activeIndex = index;
      }
    });
    
    // Calculate next index (with wrap-around)
    const nextIndex = (activeIndex + 1) % visibleIcons.length;
    const nextProjectId = visibleIcons[nextIndex].dataset.projectId;
    
    navigateToProject(nextProjectId);
  }
  
  // Function to navigate to the previous project
  function navigateToPreviousProject() {
    const icons = Array.from(document.querySelectorAll('.icon'));
    // Skip hidden projects
    const visibleIcons = icons.filter(icon => {
      const section = document.getElementById(`section-${icon.dataset.projectId}`);
      return section !== null;
    });
    
    // Find current active project
    let activeIndex = -1;
    visibleIcons.forEach((icon, index) => {
      if (icon.classList.contains('active')) {
        activeIndex = index;
      }
    });
    
    // Calculate previous index (with wrap-around)
    const prevIndex = (activeIndex - 1 + visibleIcons.length) % visibleIcons.length;
    const prevProjectId = visibleIcons[prevIndex].dataset.projectId;
    
    navigateToProject(prevProjectId);
  }
  
  // Function to update carousel rotation based on active project
  function updateCarouselRotation(activeProjectId) {
    const icons = document.querySelectorAll('.icon');
    let targetAngle = 0;
    
    // Remove active class from all icons
    icons.forEach(icon => {
      icon.classList.remove('active');
      
      // Find the target project's angle
      if (icon.dataset.projectId === activeProjectId) {
        icon.classList.add('active');
        targetAngle = parseFloat(icon.dataset.angle);
      }
    });
    
    // Rotate carousel to position active icon at the bottom
    carouselTrack.style.transform = `rotateZ(${targetAngle}rad)`;
    
    // Counter-rotate icons to keep them upright
    icons.forEach(icon => {
      const iconAngle = parseFloat(icon.dataset.angle);
      icon.style.transform = `translate(-50%, -50%) translate3d(500px, 0, 0) rotateZ(${-targetAngle}rad)`;
    });
  }
  
  // Initialize portfolio when DOM is loaded
  initPortfolio();
})();