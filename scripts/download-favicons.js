import fs from 'fs';
import path from 'path';

const LOGO_URL = 'https://i.postimg.cc/2b5F4Qvk/logosiste-(1).png';
const PUBLIC_DIR = path.resolve('./public');

async function download() {
  try {
    if (!fs.existsSync(PUBLIC_DIR)) {
      fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }
    
    console.log('Downloading official station logo from:', LOGO_URL);
    const response = await fetch(LOGO_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const filesToGenerate = [
      'favicon.ico',
      'favicon-16x16.png',
      'favicon-32x32.png',
      'apple-touch-icon.png',
      'android-chrome-192x192.png',
      'android-chrome-512x512.png'
    ];
    
    for (const filename of filesToGenerate) {
      const targetPath = path.join(PUBLIC_DIR, filename);
      fs.writeFileSync(targetPath, buffer);
      console.log(`Successfully prepared favicon asset: ${filename}`);
    }
    
    console.log('Favicon generation completed successfully!');
  } catch (error) {
    console.error('Failed to generate favicon files locally:', error);
  }
}

download();
