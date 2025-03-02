// roomTemplates.js - Defines all room templates for the tower maze

// Shared configuration with other modules
import { config } from './config.js';

// Room template definitions
// z = wall that can't have doors
// x = wall that can have doors
// 0 = floor
// a = don't care (these cells won't be modified by room placement)
export const roomTemplates = [
  {
    name: "basic3x3",
    width: 5,
    height: 5,
    layout: [
      "zxxxz",
      "x000x",
      "x000x",
      "x000x",
      "zxxxz"
    ],
    allowRotation: true,
    minFrequency: 2,
    maxFrequency: 5,
    weight: 10
  },
  {
    name: "basic2x3",
    width: 4,
    height: 5,
    layout: [
      "zxxz",
      "x00x",
      "x00x",
      "x00x",
      "zxxz"
    ],
    allowRotation: true,
    minFrequency: 3,
    maxFrequency: 6,
    weight: 15
  },
  {
    name: "L_shaped",
    width: 5,
    height: 5,
    layout: [
      "zxxxz",
      "x000x",
      "zxz0x",
      "aax0x",
      "aazxz"
    ],
    allowRotation: true,
    minFrequency: 1,
    maxFrequency: 3,
    weight: 8
  },
  {
    name: "large4x4",
    width: 6,
    height: 6,
    layout: [
      "zxxxxz",
      "x0000x",
      "x0000x",
      "x0000x",
      "x0000x",
      "zxxxxz"
    ],
    allowRotation: true,
    minFrequency: 0,
    maxFrequency: 2,
    weight: 5
  },
  {
    name: "corridor3",
    width: 5,
    height: 3,
    layout: [
      "zxxxz",
      "x000x",
      "zxxxz"
    ],
    allowRotation: true,
    minFrequency: 2,
    maxFrequency: 4,
    weight: 12
  },
  {
    name: "T_shaped",
    width: 5,
    height: 5,
    layout: [
      "zxxxz",
      "x000x",
      "zx0xz",
      "ax0xa",
      "azxza"
    ],
    allowRotation: true,
    minFrequency: 0,
    maxFrequency: 2,
    weight: 6
  }
];

// Function to rotate room templates
export function rotateTemplate(template, rotations = 1) {
  // Normalize rotations to 0-3 (0, 90, 180, 270 degrees)
  rotations = rotations % 4;
  if (rotations === 0) return template; // No rotation needed
  
  const originalLayout = template.layout;
  let newLayout = [];
  const originalHeight = originalLayout.length;
  const originalWidth = originalLayout[0].length;
  
  if (rotations === 1) { // 90 degrees clockwise
    // For 90 degree rotation, width becomes height and vice versa
    for (let x = 0; x < originalWidth; x++) {
      let newRow = "";
      for (let y = originalHeight - 1; y >= 0; y--) {
        newRow += originalLayout[y][x];
      }
      newLayout.push(newRow);
    }
  } 
  else if (rotations === 2) { // 180 degrees
    // For 180 degrees, dimensions stay the same
    for (let y = originalHeight - 1; y >= 0; y--) {
      let newRow = "";
      for (let x = originalWidth - 1; x >= 0; x--) {
        newRow += originalLayout[y][x];
      }
      newLayout.push(newRow);
    }
  }
  else if (rotations === 3) { // 270 degrees (or -90 degrees)
    // Similar to 90 degrees but in reverse direction
    for (let x = originalWidth - 1; x >= 0; x--) {
      let newRow = "";
      for (let y = 0; y < originalHeight; y++) {
        newRow += originalLayout[y][x];
      }
      newLayout.push(newRow);
    }
  }
  
  // Create a new object with rotated dimensions and layout
  return {
    ...template,
    width: newLayout[0].length,
    height: newLayout.length,
    layout: newLayout
  };
}
