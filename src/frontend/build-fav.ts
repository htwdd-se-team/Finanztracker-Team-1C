import favicons from 'favicons'
import fs from 'fs/promises'
import path from 'path'

// Import manifest data for consistency
import manifestData from './public/manifest.json'

const src = './public/images/logo-high-res.png' // Icon source file path.
const dest = './public/images' // Output directory path.
const htmlBasename = 'favicons.html' // HTML file for reference

// Comprehensive favicons configuration
const configuration = {
  // Path configuration
  path: '/images/', // Path for overriding default icons path
  
  // App metadata
  appName: manifestData.name, // "FinApp"
  appShortName: manifestData.short_name, // "FinApp" 
  appDescription: manifestData.description, // "Best way to manage your money"
  
  // Developer information
  developerName: 'FinApp Team',
  developerURL: undefined,
  
  // Cache busting and localization
  cacheBustingQueryParam: null,
  dir: 'auto', // Text direction
  lang: 'en-US', // Primary language
  
  // Colors and theming
  background: manifestData.background_color, // "#D6EBFE"
  theme_color: manifestData.theme_color, // "#3B82F6"
  
  // Apple-specific settings
  appleStatusBarStyle: 'black-translucent', // "black-translucent", "default", "black"
  
  // PWA settings
  display: manifestData.display, // "standalone"
  orientation: 'portrait', // "any", "natural", "portrait", "landscape"
  scope: '/',
  start_url: manifestData.start_url, // "/"
  
  // Native app preferences
  preferRelatedApplications: false,
  relatedApplications: undefined,
  
  // Version and rendering
  version: '1.0',
  pixel_art: false, // Keep false for regular logos
  loadManifestWithCredentials: false,
  manifestMaskable: true, // Enable maskable icons for better PWA support
  
  // Platform-specific icon generation
  icons: {
    // Android homescreen icons
    android: true,
    
    // Apple touch icons
    appleIcon: true,
    
    // Apple startup images (splash screens)
    appleStartup: true,
    
    // Regular favicons for browsers
    favicons: true,
    
    // Windows 8+ tile icons
    windows: true,
    
    // Yandex browser icon
    yandex: true
  },
  
  // App shortcuts for PWA
  shortcuts: [
    {
      name: 'View Overview',
      short_name: 'Overview',
      description: 'View your financial overview and dashboard',
      url: '/overview',
      icon: src // Use same source image for shortcuts
    },
    {
      name: 'Add Transaction',
      short_name: 'Add',
      description: 'Quickly add a new transaction',
      url: '/table',
      icon: src
    },
    {
      name: 'View Graphs',
      short_name: 'Graphs',
      description: 'View your financial graphs and analytics',
      url: '/graphs',
      icon: src
    },
    {
      name: 'Profile Settings',
      short_name: 'Profile',
      description: 'Manage your profile and app settings',
      url: '/profile',
      icon: src
    }
  ]
}

const build = async () => {
  try {
    console.log('🚀 Starting favicon generation...')
    console.log(`📁 Source: ${src}`)
    console.log(`📁 Destination: ${dest}`)
    
    // Generate favicons
    const response = await favicons(src, configuration)
    
    // Ensure destination directory exists
    await fs.mkdir(dest, { recursive: true })
    
    console.log(`📸 Generated ${response.images.length} images`)
    console.log(`📄 Generated ${response.files.length} files`)
    console.log(`🏷️  Generated ${response.html.length} HTML tags`)
    
    // Write all generated images
    await Promise.all(
      response.images.map(async (image) => {
        const imagePath = path.join(dest, image.name)
        await fs.writeFile(imagePath, image.contents)
        console.log(`✅ Created: ${image.name}`)
      })
    )
    
    // Write all generated files (manifests, browserconfig, etc.)
    await Promise.all(
      response.files.map(async (file) => {
        const filePath = path.join(dest, file.name)
        await fs.writeFile(filePath, file.contents)
        console.log(`✅ Created: ${file.name}`)
      })
    )
    
    // Write HTML reference file
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FinApp - Favicon Reference</title>
    <!-- Copy these tags to your HTML head -->
${response.html.map(tag => `    ${tag}`).join('\n')}
</head>
<body>
    <h1>FinApp Favicon Reference</h1>
    <p>Copy the HTML tags from the head section to your main HTML template.</p>
    <h2>Generated Files:</h2>
    <ul>
${response.images.map(img => `        <li>${img.name}</li>`).join('\n')}
${response.files.map(file => `        <li>${file.name}</li>`).join('\n')}
    </ul>
</body>
</html>`
    
    await fs.writeFile(path.join(dest, htmlBasename), htmlContent)
    console.log(`✅ Created: ${htmlBasename}`)
    
    // Copy main favicon to public root for easy access
    try {
      const favicon = await fs.readFile(path.join(dest, 'favicon.ico'))
      await fs.writeFile('./public/favicon.ico', favicon)
      console.log('✅ Copied favicon.ico to public root')
    } catch (error) {
      console.warn('⚠️  Could not copy favicon.ico to root:', error instanceof Error ? error.message : String(error))
    }
    
    // Update the main manifest.json with generated icons
    try {
      const newManifest = {
        ...manifestData,
        icons: [
          {
            src: '/images/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/images/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/images/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/images/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
      
      await fs.writeFile('./public/manifest.json', JSON.stringify(newManifest, null, 2))
      console.log('✅ Updated manifest.json with new icon paths')
    } catch (error) {
      console.warn('⚠️  Could not update manifest.json:', error instanceof Error ? error.message : String(error))
    }
    
    console.log('🎉 Favicon generation completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Check the generated favicons.html file for HTML tags to add to your layout')
    console.log('2. The favicon.ico has been copied to your public root')
    console.log('3. Your manifest.json has been updated with new icon paths')
    
  } catch (error) {
    console.error('❌ Error generating favicons:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

// Run the build
build()