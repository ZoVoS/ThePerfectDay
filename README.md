# Procedural Tower Maze with Rooms

A procedural generator for a "tower maze" built using HTML5 Canvas and JavaScript. The generator creates a multi-layered grid that represents a tower floor, places predefined room templates, and then carves a maze through the remaining space.

## Features

- Configurable grid size, cell size, and visualization speed
- Circular tower boundary with configurable radius
- Predefined room templates with different shapes and sizes
- Room rotation support (0°, 90°, 180°, 270°)
- Maze generation with recursive backtracking algorithm
- Room-to-maze connection logic
- Optional dead-end removal
- Straight-line bias for more natural-looking pathways
- Extra connections to create loops in the maze

## Files and Structure

The project is organized into several JavaScript modules:

### `config.js`
Central configuration for the tower maze generator. Contains all adjustable parameters.

### `roomTemplates.js`
Defines all room templates and provides functions for rotating them.

### `roomPlacement.js`
Handles room template placement and connecting rooms to the maze.

### `removeDeadEnds.js`
Provides functionality to remove dead-end corridors (optional).

### `main.js`
The main entry point that coordinates the generation process.

### `index.html`
The HTML page that displays the maze and provides controls.

## Room Template Format

Room templates are defined as objects with the following structure:

```javascript
{
  name: "basic3x3",     // Template name
  width: 5,             // Width including walls
  height: 5,            // Height including walls
  layout: [             // 2D grid representing the room
    "zxxxz",            // z = wall that can't have doors
    "x000x",            // x = wall that can have doors
    "x000x",            // 0 = floor
    "x000x",            // a = don't care (these cells won't be modified)
    "zxxxz"
  ],
  allowRotation: true,  // Whether this template can be rotated
  minFrequency: 2,      // Minimum number to place
  maxFrequency: 5,      // Maximum number to place
  weight: 10            // Relative probability of selection
}
```

## Generation Process

1. Create a circular tower boundary
2. Place pillars at regular intervals
3. Place room templates in valid locations
4. Generate a maze in the remaining space using recursive backtracking
5. Connect rooms to the maze with doors
6. Add extra connections to create loops
7. Optionally remove dead ends

## Usage

To use the generator:

1. Open `index.html` in a web browser
2. Click "Generate New Maze" to create a new maze

## Customization

To customize the maze generation:

1. Edit the parameters in `config.js` to adjust maze characteristics
2. Modify or add room templates in `roomTemplates.js`
3. Change cell colors in the visualization code for different visual styles

## Future Enhancements

- Room contents and decoration
- Multiple floors with staircases
- Player character movement
- Game objectives and enemies
- Save/load functionality
