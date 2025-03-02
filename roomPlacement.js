// roomPlacement.js - Handles placement of rooms in the tower maze

// Import shared configuration and room templates
import { config } from './config.js';
import { roomTemplates, rotateTemplate } from './roomTemplates.js';

// Place room templates in the grid
export async function placeRoomTemplates(grid, ctx, cellSize) {
  const placedRooms = [];
  console.log("Starting room placement...");
  
  // Create a weighted pool of templates
  const templatePool = [];
  for (const template of roomTemplates) {
    for (let i = 0; i < template.weight; i++) {
      templatePool.push(template);
    }
  }
  
  // Track how many of each template we've placed
  const placedCounts = {};
  roomTemplates.forEach(template => {
    placedCounts[template.name] = 0;
  });
  
  // Try to place rooms
  let attempts = 0;
  const maxAttempts = 500;
  
  // First, ensure minimum frequencies
  for (const template of roomTemplates) {
    if (!template.minFrequency) continue;
    
    while (placedCounts[template.name] < template.minFrequency && attempts < maxAttempts) {
      attempts++;
      
      if (await tryPlaceTemplate(template, grid, placedRooms, placedCounts, ctx, cellSize)) {
        // Successfully placed
        attempts = 0; // Reset attempts for next template
      }
    }
  }
  
  // Then try to place additional rooms up to max frequencies
  attempts = 0;
  while (attempts < maxAttempts && templatePool.length > 0) {
    attempts++;
    
    // Select a random template from the pool
    const templateIndex = Math.floor(Math.random() * templatePool.length);
    const template = templatePool[templateIndex];
    
    // Skip if we've already placed the maximum
    if (placedCounts[template.name] >= template.maxFrequency) {
      // Remove this template from the pool
      templatePool.splice(templateIndex, 1);
      continue;
    }
    
    // Try to place this template
    await tryPlaceTemplate(template, grid, placedRooms, placedCounts, ctx, cellSize);
  }
  
  console.log(`Room placement complete. Placed ${placedRooms.length} rooms.`);
  return placedRooms;
}

// Try to place a single template
async function tryPlaceTemplate(template, grid, placedRooms, placedCounts, ctx, cellSize) {
  const gridSize = grid.length;
  
  // Apply a random rotation if allowed
  let rotatedTemplate = template;
  if (template.allowRotation) {
    const rotations = Math.floor(Math.random() * 4); // 0, 1, 2, or 3 rotations
    rotatedTemplate = rotateTemplate(template, rotations);
  }
  
  // Pick a random position
  const x = Math.floor(Math.random() * (gridSize - rotatedTemplate.width));
  const y = Math.floor(Math.random() * (gridSize - rotatedTemplate.height));
  
  // Check if position is valid
  if (canPlaceRoomAt(grid, x, y, rotatedTemplate)) {
    // Place the room
    placeRoomAt(grid, x, y, rotatedTemplate);
    
    // Update the room count
    placedCounts[template.name]++;
    
    // Add to placed rooms list
    placedRooms.push({
      x, y, 
      width: rotatedTemplate.width, 
      height: rotatedTemplate.height,
      template: rotatedTemplate
    });
    
    // Visualize the room placement if ctx is provided
    if (ctx) {
      await visualizePlacement(grid, ctx, cellSize);
    }
    
    return true;
  }
  
  return false;
}

// Check if a room can be placed at a specific position
function canPlaceRoomAt(grid, x, y, template) {
  const gridSize = grid.length;
  const center = { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) };
  const radius = gridSize * config.towerRadiusFactor;
  
  for (let dy = 0; dy < template.height; dy++) {
    for (let dx = 0; dx < template.width; dx++) {
      const worldX = x + dx;
      const worldY = y + dy;
      const cell = template.layout[dy][dx];
      
      // Skip checking "don't care" cells
      if (cell === 'a') {
        continue;
      }
      
      // Check if position is within grid bounds
      if (worldX < 0 || worldX >= gridSize || worldY < 0 || worldY >= gridSize) {
        return false;
      }
      
      // Check if position is within tower radius
      const distFromCenter = Math.sqrt(
        Math.pow(worldX - center.x, 2) + 
        Math.pow(worldY - center.y, 2)
      );
      if (distFromCenter > radius - config.wallThickness) {
        return false;
      }
      
      // Check if cell is already used by something we can't override
      // Don't place on pillars, existing walls, or paths
      if (grid[worldX][worldY] === "pillar" || 
          grid[worldX][worldY] === "wall" || 
          grid[worldX][worldY] === "path" ||
          grid[worldX][worldY] === "room_floor" ||
          grid[worldX][worldY] === "wall_door" ||
          grid[worldX][worldY] === "wall_no_door" ||
          grid[worldX][worldY] === "pin") {
        return false;
      }
    }
  }
  
  return true;
}

// Place a room template on the grid
function placeRoomAt(grid, x, y, template) {
  for (let dy = 0; dy < template.height; dy++) {
    for (let dx = 0; dx < template.width; dx++) {
      const worldX = x + dx;
      const worldY = y + dy;
      const cell = template.layout[dy][dx];
      
      // Skip "don't care" cells
      if (cell === 'a') {
        continue;
      }
      
      switch (cell) {
        case 'z':
          grid[worldX][worldY] = "wall_no_door"; // Wall that can't have doors
          break;
        case 'x':
          grid[worldX][worldY] = "wall_door"; // Wall that can have doors
          break;
        case '0':
          grid[worldX][worldY] = "room_floor"; // Floor inside room
          break;
        // Add more types as needed
      }
    }
  }
}

// Find potential door positions in all placed rooms
export function findPotentialDoors(grid, placedRooms) {
  const doorPositions = [];
  const gridSize = grid.length;
  
  for (const room of placedRooms) {
    // Check the perimeter of each room
    for (let dy = 0; dy < room.height; dy++) {
      for (let dx = 0; dx < room.width; dx++) {
        const worldX = room.x + dx;
        const worldY = room.y + dy;
        
        // Is this a wall that can have doors?
        if (grid[worldX][worldY] === "wall_door") {
          // Check if there's a corridor or path adjacent to this wall
          const neighbors = [
            { x: worldX + 1, y: worldY },
            { x: worldX - 1, y: worldY },
            { x: worldX, y: worldY + 1 },
            { x: worldX, y: worldY - 1 }
          ];
          
          for (const neighbor of neighbors) {
            if (neighbor.x >= 0 && neighbor.x < gridSize && 
                neighbor.y >= 0 && neighbor.y < gridSize &&
                grid[neighbor.x][neighbor.y] === "path") {
              // Found a potential door position
              doorPositions.push({ x: worldX, y: worldY });
              break;
            }
          }
        }
      }
    }
  }
  
  return doorPositions;
}

// Connect rooms to the maze with doors
export async function connectRooms(grid, placedRooms, ctx, cellSize) {
  console.log("Connecting rooms to maze...");
  
  // Find all potential door locations
  const doorPositions = findPotentialDoors(grid, placedRooms);
  
  // Create a map of each room to its potential doors
  const roomDoors = {};
  for (let i = 0; i < placedRooms.length; i++) {
    const room = placedRooms[i];
    roomDoors[i] = doorPositions.filter(door => 
      door.x >= room.x && door.x < room.x + room.width &&
      door.y >= room.y && door.y < room.y + room.height
    );
  }
  
  // Ensure each room has at least one door
  for (let i = 0; i < placedRooms.length; i++) {
    const doors = roomDoors[i];
    
    if (doors.length > 0) {
      // Choose a random door position
      const doorIndex = Math.floor(Math.random() * doors.length);
      const door = doors[doorIndex];
      
      // Place a door
      grid[door.x][door.y] = "door";
      
      // Visualize the door placement if ctx is provided
      if (ctx) {
        await visualizePlacement(grid, ctx, cellSize);
      }
      
      // Optionally add more doors based on probability
      for (let j = 0; j < doors.length; j++) {
        if (j !== doorIndex && Math.random() < config.extraDoorProbability) {
          const extraDoor = doors[j];
          grid[extraDoor.x][extraDoor.y] = "door";
          
          if (ctx) {
            await visualizePlacement(grid, ctx, cellSize);
          }
        }
      }
    } else {
      console.log(`Warning: Room ${i} has no potential doors`);
    }
  }
  
  console.log("Room connections complete");
}

// Visualize the room placement (for debugging and animation)
async function visualizePlacement(grid, ctx, cellSize) {
  const gridSize = grid.length;
  
  // Only redraw if we have a canvas context
  if (!ctx) return;
  
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      let color;
      switch (grid[i][j]) {
        case "out":          color = "#000000"; break;
        case "wall":         color = "#555555"; break;
        case "wall_no_door": color = "#774444"; break;
        case "wall_door":    color = "#665566"; break;
        case "box":          color = "#777777"; break;
        case "floor":        color = "#CCCCCC"; break;
        case "room_floor":   color = "#CCFFCC"; break;
        case "pillar":       color = "#FF0000"; break;
        case "pin":          color = "#00FF00"; break;
        case "path":         color = "#FFFFFF"; break;
        case "door":         color = "#FFFF00"; break;
        default:             color = "#FFFFFF"; break;
      }
      ctx.fillStyle = color;
      ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
    }
  }
  
  // Add a small delay for visualization
  return new Promise(resolve => setTimeout(resolve, 5));
}
