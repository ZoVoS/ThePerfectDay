// config.js - Central configuration for the tower maze generator

// Export a configuration object that can be modified
export const config = {
  // Grid settings
  gridSize: 65,                 // Grid dimensions (changed from 129 to 65)
  cellSize: 8,                  // Pixel size of each cell (changed from 4 to 8)
  sleepThreshold: 100,          // Delay every X iterations during grid generation (changed from 50 to 100)
  
  // Tower settings
  towerRadiusFactor: 0.5,       // Tower radius is gridSize * towerRadiusFactor (0.5 gives a half-grid radius)
  wallThickness: 3,             // Thickness for the outer boundary wall
  pillarSpacing: 8,             // Spacing between pillars on floor cells (changed from 16 to 8)
  
  // Maze generation settings
  connectionProbability: 0.1,   // Chance (10%) to carve an extra connection after maze generation
  straightBias: 0.7,            // Probability to continue in the same direction if available (0 to 1)
  
  // Room settings
  minRooms: 8,                  // Minimum number of rooms to place
  maxRoomPlacementAttempts: 500,// Maximum number of attempts to place rooms
  extraDoorProbability: 0.1,    // Probability to create additional doors for rooms (changed from 0.2 to 0.1)
  
  // Dead end settings
  removeDeadEnds: true,        // Whether to remove dead ends
  deadEndRemovalChance: 0.8     // Probability to remove a dead end (allows some to remain)
};

// Function to reset the configuration to default values
export function resetConfig() {
  config.gridSize = 65;         // Changed from 129 to 65
  config.cellSize = 8;          // Changed from 4 to 8
  config.sleepThreshold = 100;  // Changed from 50 to 100
  config.towerRadiusFactor = 0.5;
  config.wallThickness = 3;
  config.pillarSpacing = 8;     // Changed from 16 to 8
  config.connectionProbability = 0.1;
  config.straightBias = 0.7;
  config.minRooms = 8;
  config.maxRoomPlacementAttempts = 500;
  config.extraDoorProbability = 0.1; // Changed from 0.2 to 0.1
  config.removeDeadEnds = false;
  config.deadEndRemovalChance = 0.8;
}

// Function to update config with user-provided values
export function updateConfig(userConfig) {
  Object.assign(config, userConfig);
}