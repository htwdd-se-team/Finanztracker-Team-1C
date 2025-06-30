import favicons from 'favicons'
import fs from 'fs/promises'
import path from 'path'

// Import manifest data and navigation config
import manifestData from './public/manifest.json'
import { navItems } from './navigation-config'

const src = './public/logo-high-res.png' // Icon source file path.
const dest = './public/images' // Output directory path.


const configuration = {
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

  // Colors and theming - Set background to transparent to preserve transparency
  background: 'transparent', // Changed from manifestData.background_color to preserve transparency
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
  pixel_art: false, // Keep false for regular logos - this helps with transparency
  loadManifestWithCredentials: false,
  manifestMaskable: false, // Disable maskable to preserve transparency better

  // Platform-specific icon generation
  icons: {
    android: true,   // Android homescreen icons 
    appleIcon: true,  // Apple touch icons
    appleStartup: true,   // Apple startup images (splash screens)
    favicons: true, // Regular favicons for browsers
    windows: true, // Windows 8+ tile icons 
    yandex: true,
  },

  // App shortcuts for PWA - using generated icons
  shortcuts: navItems.map(navItem => ({
    name: navItem.title,
    short_name: navItem.title,
    description: `Navigieren zu ${navItem.title}`,
    url: navItem.url,
    icon: src
  }))

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

    await Promise.all(
      response.files.map(async (file) => {
        const filePath = path.join(dest, file.name)
        if (file.name !== 'manifest.webmanifest') {
          await fs.writeFile(filePath, file.contents)
          console.log(`✅ Created: ${file.name}`)
        }
      })
    )

    const fixedHtml = response.html.map(tag => {
      // Fix manifest path
      if (tag.includes('manifest.webmanifest')) {
        tag = tag.replace('/images/manifest.webmanifest', '/manifest.json')
      }

      // Ensure self-closing tags are properly closed for JSX
      if (tag.includes('<link') && !tag.endsWith('/>')) {
        tag = tag.replace('>', ' />')
      }
      if (tag.includes('<meta') && !tag.endsWith('/>')) {
        tag = tag.replace('>', ' />')
      }

      return tag
    })

    const reactContent = `export default function MetaWrapper() {
  return (
    <>
${fixedHtml.map(tag => `      ${tag}`).join('\n')}
    </>
  )
}
`

    await fs.writeFile('./app/meta-wrapper.tsx', reactContent)
    console.log(`✅ Updated meta-wrapper.tsx with new favicon meta tags`)

    // Copy main favicon to public root for easy access
    try {
      const favicon = await fs.readFile(path.join(dest, 'favicon.ico'))
      await fs.writeFile('./public/favicon.ico', favicon)
      console.log('✅ Copied favicon.ico to public root')
    } catch (error) {
      console.warn('⚠️  Could not copy favicon.ico to root:', error instanceof Error ? error.message : String(error))
    }

    // Update the main manifest.json with generated icons

    await fs.writeFile('./public/manifest.json', JSON.stringify(manifestData, null, 2))
    console.log('✅ Updated ./public/manifest.json with new icon paths')



  } catch (error) {
    console.error('❌ Error generating favicons:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

// Run the build
build()