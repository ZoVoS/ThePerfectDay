// removeDeadEnds.js - Function to remove dead-end corridors

import { config } from './config.js';

// Function to remove dead-end corridors
export async function removeDeadEnds(grid, ctx, cellSize) {
  console.log("Removing dead ends...");
  const gridSize = grid.length;
  let changed = true;
  let iterations = 0;
  const maxIterations = 100; // Safety limit
  
  // Define directions for checking neighbors
  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 }
  ];
  
  // Keep removing dead ends until no more changes or max iterations reached
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    
    // Collect all dead ends
    const deadEnds = [];
    
    for (let x = 1; x < gridSize - 1; x++) {
      for (let y = 1; y < gridSize - 1; y++) {
        // Only consider path cells
        if (grid[x][y] === "path") {
          let exitCount = 0;
          
          // Count neighboring path cells
          for (const dir of directions) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            
            if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
              if (grid[nx][ny] === "path" || grid[nx][ny] === "door" || 
                  grid[nx][ny] === "room_floor") {
                exitCount++;
              }
            }
          }
          
          // If only one exit, it's a dead end
          if (exitCount === 1) {
            deadEnds.push({ x, y });
          }
        }
      }
    }
    
    // If there are dead ends, remove them
    if (deadEnds.length > 0) {
      changed = true;
      
      // Process each dead end
      for (const deadEnd of deadEnds) {
        grid[deadEnd.x][deadEnd.y] = "floor"; // Fill it back in
      }
      
      // Visualize the changes
      if (ctx) {
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
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }
  
  console.log(`Dead end removal complete after ${iterations} iterations`);
}
