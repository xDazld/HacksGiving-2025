import path from 'path';
import dotenv from 'dotenv';

// Load .env from parent directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { OpenAIClient } from '../services/OpenAIClient';
import { ScavengerHuntService } from '../services/ScavengerHuntService';

async function testScavengerHunt() {
  console.log('=== Scavenger Hunt AI Test (GitHub Models) ===\n');

  // Client will load GITHUB_TOKEN from process.env
  const client = new OpenAIClient();

  const service = new ScavengerHuntService(client);

  // 1. Start Game
  console.log('1. Starting new game...');
  const plant = service.startGame([]);
  if (!plant) {
    console.error('❌ No plant selected!');
    return;
  }
  console.log(`✓ Selected: ${plant.commonName} (${plant.scientificName})\n`);

  // 2. Get Description
  console.log('2. Getting plant description...');
  try {
    const description = await service.getPlantDescription(plant);
    console.log(`✓ Description: ${description}\n`);
  } catch (error: any) {
    console.error('❌ Error:', error.message, '\n');
  }

  // 3. Get Hint
  console.log('3. Getting hint...');
  try {
    const hint = await service.getHint(plant);
    console.log(`✓ Hint: ${hint}\n`);
  } catch (error: any) {
    console.error('❌ Error:', error.message, '\n');
  }

  // 4. Test Vision Verification
  console.log('4. Testing vision verification...');
  try {
    // Using a 1x1 transparent PNG as a test image
    const mockImage = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    
    console.log('   Sending image to vision API...');
    const result = await service.verifyFind(mockImage, plant);
    
    console.log('✓ Vision API Response:');
    console.log(`   - Match: ${result.isMatch}`);
    console.log(`   - Feedback: ${result.feedback}\n`);
    
  } catch (error: any) {
    console.error('❌ Vision API Error:', error.message);
  }

  console.log('=== Test Complete ===');
}

testScavengerHunt().catch(console.error);
