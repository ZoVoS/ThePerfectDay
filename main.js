// main.js - Main entry point for the tower maze generator

// Import configuration and modules
import { config } from './config.js';
import { placeRoomTemplates, connectRooms } from './roomPlacement.js';
import { removeDeadEnds } from './removeDeadEnds.js';

// Utility sleep function for delays
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function to generate the grid - exported to be called from UI
export async function generateGrid() {
  console.log("Starting generation with config:", config);
  
  const gridSize = config.gridSize;
  const cellSize = config.cellSize;
  
  // Set up the canvas
  const canvas = document.getElementById("canvas");
  canvas.width = gridSize * cellSize;
  canvas.height = gridSize * cellSize;
  const ctx = canvas.getContext("2d");
  
  // Create a 2D grid array
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
  
  const center = { x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) };
  const radius = gridSize * config.towerRadiusFactor;
  
  // Step 1: Fill the grid by default with "box"
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      grid[i][j] = "box";
    }
  }
  
  // Step 2: Set special types based on distance from center
  let sleepCounter = 0;
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const dx = i - center.x;
      const dy = j - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      let type = grid[i][j]; // default is "box"
      if (dist > radius) {
        type = "out"; // Out-of-bounds: outside tower
      } else if (radius - dist < config.wallThickness) {
        type = "wall"; // Outer ring wall
      } else if (i === center.x && j === center.y) {
        type = "pin"; // Center pin
      } else {
        // Otherwise, set as "floor" where we intend to carve the maze
        type = "floor";
      }
      
      // Add pillars on floor cells at every pillarSpacing interval
      if (type === "floor" && i % config.pillarSpacing === 0 && j % config.pillarSpacing === 0) {
        type = "pillar";
      }
      
      grid[i][j] = type;
      
      // Visualize the grid generation
      let color;
      switch (type) {
        case "out":    color = "#000000"; break; // Black for out-of-bounds
        case "wall":   color = "#555555"; break; // Dark gray for tower wall
        case "box":    color = "#777777"; break; // (Should rarely occur now)
        case "floor":  color = "#CCCCCC"; break; // Light gray for floors
        case "pillar": color = "#FF0000"; break; // Red for pillars
        case "pin":    color = "#00FF00"; break; // Green for center pin
        default:       color = "#FFFFFF"; break;
      }
      ctx.fillStyle = color;
      ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
      
      sleepCounter++;
      if (sleepCounter >= config.sleepThreshold) {
        await sleep(1);
        sleepCounter = 0;
      }
    }
  }
  console.log("Grid generation complete!");
  
  // Step 3: Place room templates
  const placedRooms = await placeRoomTemplates(grid, ctx, cellSize);
  
  // Step 4: Run maze generation in the remaining space
  await carveMaze(grid, ctx, cellSize);
  
  // Step 5: Connect rooms to the maze
  await connectRooms(grid, placedRooms, ctx, cellSize);
  
  // Step 6: After maze carving, add random extra connections
  await addExtraConnections(grid, ctx, cellSize);
  
  // Step 7: Remove dead ends (if enabled)
  if (config.removeDeadEnds) {
    await removeDeadEnds(grid, ctx, cellSize);
  }
  
  console.log("Maze generation complete!");
}

// Carve a maze using recursive backtracking algorithm
async function carveMaze(grid, ctx, cellSize) {
  const gridSize = grid.length;
  const directions = [
    { x: 2, y: 0, name: "right" },
    { x: -2, y: 0, name: "left" },
    { x: 0, y: 2, name: "down" },
    { x: 0, y: -2, name: "up" }
  ];
  
  // Helper function to check if a cell is within bounds
  function isInBounds(x, y) {
    return x > 0 && y > 0 && x < gridSize - 1 && y < gridSize - 1;
  }
  
  // Helper function to check if a cell can be carved into
  function isCarvable(x, y) {
    // Only carve if the cell is a normal "floor" or "box"
    // Avoid room floors, walls, etc.
    return isInBounds(x, y) && (grid[x][y] === "floor" || grid[x][y] === "box");
  }
  
  // Start at the center
  let startX = Math.floor(gridSize / 2);
  let startY = Math.floor(gridSize / 2);
  // Each stack item stores x, y, and the last direction (if any)
  let stack = [{ x: startX, y: startY, dir: null }];
  
  // Use a sleep counter for maze carving as well
  let mazeSleepCounter = 0;
  
  while (stack.length > 0) {
    let current = stack[stack.length - 1];
    
    // Build possible moves
    let possibleMoves = directions
      .map(d => ({
        x: current.x + d.x,
        y: current.y + d.y,
        betweenX: current.x + d.x / 2,
        betweenY: current.y + d.y / 2,
        dir: d.name
      }))
      .filter(n => isCarvable(n.x, n.y));
    
    // Apply straight bias: if the last direction is available, favor it
    if (current.dir) {
      let biasedMove = possibleMoves.find(m => m.dir === current.dir);
      if (biasedMove && Math.random() < config.straightBias) {
        possibleMoves = [biasedMove]; // choose the same direction
      }
    }
    
    if (possibleMoves.length > 0) {
      // Choose one move at random from possibleMoves
      let nextMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      
      // Carve the path
      grid[nextMove.betweenX][nextMove.betweenY] = "path";
      grid[nextMove.x][nextMove.y] = "path";
      
      // Push the new position onto the stack
      stack.push({ x: nextMove.x, y: nextMove.y, dir: nextMove.dir });
    } else {
      // Backtrack if no moves available
      stack.pop();
    }
    
    // Redraw the maze on canvas
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
    
    mazeSleepCounter++;
    if (mazeSleepCounter >= config.sleepThreshold * 2) {
      await sleep(1);
      mazeSleepCounter = 0;
    }
  }
}

// Add extra connections to make the maze imperfect
async function addExtraConnections(grid, ctx, cellSize) {
  const gridSize = grid.length;
  
  // Iterate over the grid and try to add extra connections
  for (let i = 1; i < gridSize - 1; i++) {
    for (let j = 1; j < gridSize - 1; j++) {
      if (grid[i][j] === "path") {
        // Check all four cardinal directions
        const neighbors = [
          { x: i + 2, y: j },
          { x: i - 2, y: j },
          { x: i, y: j + 2 },
          { x: i, y: j - 2 }
        ];
        
        for (let n of neighbors) {
          if (n.x > 0 && n.x < gridSize && n.y > 0 && n.y < gridSize) {
            if ((grid[n.x][n.y] === "box" || grid[n.x][n.y] === "floor") && 
                Math.random() < config.connectionProbability) {
              // Carve a connection
              const betweenX = i + (n.x - i) / 2;
              const betweenY = j + (n.y - j) / 2;
              grid[betweenX][betweenY] = "path";
              grid[n.x][n.y] = "path";
              
              // Visualize the change
              ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
              for (let x = 0; x < gridSize; x++) {
                for (let y = 0; y < gridSize; y++) {
                  let color;
                  switch (grid[x][y]) {
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
                  ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
              }
              
              // Short delay for visualization
              await sleep(0.5);
            }
          }
        }
      }
    }
  }
  
  console.log("Extra connections added!");
}