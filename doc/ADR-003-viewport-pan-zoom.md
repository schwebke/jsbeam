# ADR-003: Viewport Pan and Zoom

## Status
Proposed

## Context
JSBeam currently displays a fixed grid view without the ability to navigate or zoom in/out of the structural model. As models grow in size or require detailed work, users need:
- **Viewport panning** to navigate around large models
- **Zoom functionality** to work at different detail levels
- **Adaptive grid spacing** that remains usable at all zoom levels
- **Universal navigation** that works consistently across all application modes
- **Precise coordinate handling** that maintains accuracy during transformations

The current implementation uses a fixed SVG viewBox that matches the container dimensions, with nodes and grid points rendered in screen coordinates. This approach doesn't support viewport transformations or coordinate system independence.

### SVG Transform Precision Limitations
Research into SVG numerical precision reveals significant limitations for extreme zoom levels:

**SVG Specification Constraints:**
- SVG requires single-precision (32-bit) floating-point for calculations, double-precision (64-bit) for transformations
- Practical precision limit: differences finer than 1/4,000,000 of the larger number are unreliable
- Recommended coordinate range: ±5,000 with decimals no more precise than 0.01

**Browser Implementation Issues:**
- Firefox's Cairo engine: 32-bit fixed-point precision (24 bits before decimal, 8 bits fraction)
- Variable browser support for extreme coordinate ranges
- Performance degradation with large coordinate values

**Sources:**
- [The Limits of Numbers in SVG](https://oreillymedia.github.io/Using_SVG/extras/ch08-precision.html) - O'Reilly SVG precision guide
- [SVG viewBox resolution limits](https://stackoverflow.com/questions/27161079/svg-viewbox-resolution-limits) - Stack Overflow discussion
- [Precision of SVG coordinates](https://stackoverflow.com/questions/27659518/precision-of-svg-coordinates) - Browser precision analysis
- [Is it possible to create an SVG that is precise to 1,000,000,000% zoom?](https://stackoverflow.com/questions/31144907/is-it-possible-to-create-an-svg-that-is-precise-to-1-000-000-000-zoom) - Extreme zoom precision study

## Decision
Implement a comprehensive viewport transformation system with:

1. **Viewport State Management**: Track pan offset and zoom level
2. **Coordinate System Separation**: Distinguish between screen coordinates and world coordinates
3. **SVG Transform-based Rendering**: Use SVG transformations for efficient viewport updates
4. **Adaptive Grid System**: Dynamic grid spacing based on zoom level
5. **Universal Navigation**: Pan and zoom work in all application modes
6. **Menu Integration**: Zoom functions accessible through menu system

## Implementation Strategy

### Viewport State
```javascript
const [viewport, setViewport] = useState({
  pan: { x: 0, z: 0 },        // World coordinate offset
  zoom: 1.0,                  // Zoom level (1.0 = 100%)
  minZoom: 1e-8,              // Minimum zoom level (extremely small for dimensionless analysis)
  maxZoom: 1e+8               // Maximum zoom level (extremely large for dimensionless analysis)
});
```

### Coordinate System Transformation
```javascript
// Screen to World coordinates
const screenToWorld = (screenX, screenZ, viewport) => {
  return {
    x: (screenX / viewport.zoom) - viewport.pan.x,
    z: (screenZ / viewport.zoom) - viewport.pan.z
  };
};

// World to Screen coordinates
const worldToScreen = (worldX, worldZ, viewport) => {
  return {
    x: (worldX + viewport.pan.x) * viewport.zoom,
    z: (worldZ + viewport.pan.z) * viewport.zoom
  };
};
```

### Manual Transform Approach (Recommended)
Due to SVG transform precision limitations with extreme zoom levels, we implement manual coordinate transformation:

```javascript
// Transform world coordinates to screen coordinates for rendering
const transformToScreen = (worldX, worldZ, viewport, dimensions) => {
  // Apply viewport transformation manually
  const screenX = (worldX - viewport.pan.x) * viewport.zoom + dimensions.width / 2;
  const screenZ = (worldZ - viewport.pan.z) * viewport.zoom + dimensions.height / 2;
  
  return { x: screenX, z: screenZ };
};

// SVG structure without transform (keeps SVG in pixel space)
<svg width="100%" height="100%" viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}>
  {/* All elements rendered in screen coordinates */}
  {gridPoints.map(([worldX, worldZ]) => {
    const screen = transformToScreen(worldX, worldZ, viewport, dimensions);
    return html`<circle cx=${screen.x} cy=${screen.z} r="0.5" fill="var(--grid-color)" />`;
  })}
  
  {model.nodes.map(node => {
    const screen = transformToScreen(node.coordinates.x, node.coordinates.z, viewport, dimensions);
    return html`<circle cx=${screen.x} cy=${screen.z} r="6" fill="none" stroke="var(--accent-color)" stroke-width="2" class="node" />`;
  })}
</svg>
```

### Alternative: Hybrid Approach with Safe Transform Limits
For better performance with moderate zoom levels, use SVG transforms with safety limits:

```javascript
// Use SVG transform for zoom levels within safe range, manual transform for extreme levels
const useSVGTransform = viewport.zoom >= 1e-3 && viewport.zoom <= 1e+3;

const getSafeTransform = (viewport) => {
  if (useSVGTransform) {
    return `translate(${viewport.pan.x * viewport.zoom}, ${viewport.pan.z * viewport.zoom}) scale(${viewport.zoom})`;
  }
  return null; // Use manual transform
};
```

### Adaptive Grid System
```javascript
const calculateGridSpacing = (baseGridSize, zoom) => {
  // Target: 20-100 pixels between grid lines on screen
  const targetScreenSpacing = 40;
  const currentScreenSpacing = baseGridSize * zoom;
  
  // Find appropriate grid spacing
  let gridSpacing = baseGridSize;
  
  // If grid is too dense, increase spacing
  while (gridSpacing * zoom < 20 && gridSpacing < 1000) {
    gridSpacing *= 2;
  }
  
  // If grid is too coarse, decrease spacing
  while (gridSpacing * zoom > 100 && gridSpacing > 1) {
    gridSpacing /= 2;
  }
  
  return gridSpacing;
};
```

### Pan Implementation
```javascript
const handleMouseDown = (event) => {
  if (event.button === 1) { // Middle mouse button
    setIsPanning(true);
    setPanStart({
      x: event.clientX,
      z: event.clientY,
      viewport: { ...viewport }
    });
    event.preventDefault();
  }
};

const handleMouseMove = (event) => {
  if (isPanning) {
    const deltaX = (event.clientX - panStart.x) / viewport.zoom;
    const deltaZ = (event.clientY - panStart.z) / viewport.zoom;
    
    setViewport(prev => ({
      ...prev,
      pan: {
        x: panStart.viewport.pan.x + deltaX,
        z: panStart.viewport.pan.z + deltaZ
      }
    }));
  }
  
  // Update cursor coordinates in world space
  const worldCoords = screenToWorld(
    event.clientX - rect.left,
    event.clientY - rect.top,
    viewport
  );
  onCursorMove(worldCoords);
};
```

### Zoom Implementation
```javascript
const handleWheel = (event) => {
  if (event.ctrlKey) {
    event.preventDefault();
    
    // Get mouse position in world coordinates before zoom
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseScreen = {
      x: event.clientX - rect.left,
      z: event.clientY - rect.top
    };
    const mouseWorldBefore = screenToWorld(mouseScreen.x, mouseScreen.z, viewport);
    
    // Calculate new zoom level
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(
      viewport.minZoom,
      Math.min(viewport.maxZoom, viewport.zoom * zoomFactor)
    );
    
    // Calculate new pan to keep mouse position fixed
    const mouseWorldAfter = screenToWorld(mouseScreen.x, mouseScreen.z, { ...viewport, zoom: newZoom });
    const panAdjustment = {
      x: mouseWorldBefore.x - mouseWorldAfter.x,
      z: mouseWorldBefore.z - mouseWorldAfter.z
    };
    
    setViewport(prev => ({
      ...prev,
      zoom: newZoom,
      pan: {
        x: prev.pan.x + panAdjustment.x,
        z: prev.pan.z + panAdjustment.z
      }
    }));
  }
};
```

### Menu Zoom Functions
```javascript
const zoomIn = () => {
  const zoomFactor = 1.5;
  const newZoom = Math.min(viewport.maxZoom, viewport.zoom * zoomFactor);
  
  // Zoom around viewport center
  const viewportCenter = {
    x: dimensions.width / 2,
    z: dimensions.height / 2
  };
  
  const centerWorldBefore = screenToWorld(viewportCenter.x, viewportCenter.z, viewport);
  const centerWorldAfter = screenToWorld(viewportCenter.x, viewportCenter.z, { ...viewport, zoom: newZoom });
  
  setViewport(prev => ({
    ...prev,
    zoom: newZoom,
    pan: {
      x: prev.pan.x + (centerWorldBefore.x - centerWorldAfter.x),
      z: prev.pan.z + (centerWorldBefore.z - centerWorldAfter.z)
    }
  }));
};

const zoomOut = () => {
  const zoomFactor = 1 / 1.5;
  const newZoom = Math.max(viewport.minZoom, viewport.zoom * zoomFactor);
  
  // Similar implementation to zoomIn but with inverse factor
  // ... (implementation follows same pattern)
};
```

## UI Changes

### Menu System
Add "View" menu with zoom controls:
```javascript
<div class="menu-item" onClick={handleViewMenuClick}>
  View
  ${showViewMenu && html`
    <div class="dropdown">
      <div class="dropdown-item" onClick=${zoomIn}>Zoom In</div>
      <div class="dropdown-item" onClick=${zoomOut}>Zoom Out</div>
      <div class="dropdown-item" onClick=${zoomFit}>Zoom to Fit</div>
      <div class="dropdown-item" onClick=${zoomActual}>Actual Size</div>
    </div>
  `}
</div>
```

### Status Bar Enhancement
Display zoom level and viewport information:
```javascript
<div class="statusbar">
  Mode: ${modeDisplay} | 
  X: ${Math.round(cursorCoordinates.x)}, Z: ${Math.round(cursorCoordinates.z)} | 
  Zoom: ${Math.round(viewport.zoom * 100)}% | 
  Nodes: ${model.nodes.length}, Beams: ${model.beams.length}
</div>
```

### Cursor Styling
Add pan cursor during middle mouse drag:
```css
.content-area.panning {
  cursor: grab;
}

.content-area.panning:active {
  cursor: grabbing;
}
```

## Node Placement Accuracy
Update node placement to use world coordinates:
```javascript
const handleClick = (event) => {
  if (applicationMode === 'addNode') {
    const rect = event.currentTarget.getBoundingClientRect();
    const screenCoords = {
      x: event.clientX - rect.left,
      z: event.clientY - rect.top
    };
    const worldCoords = screenToWorld(screenCoords.x, screenCoords.z, viewport);
    onAddNode(worldCoords);
  }
};
```

## Grid Rendering Updates
Render grid in world coordinates with adaptive spacing:
```javascript
const gridSpacing = calculateGridSpacing(20, viewport.zoom);
const gridPoints = [];

// Calculate visible world area
const visibleWorldArea = {
  minX: screenToWorld(0, 0, viewport).x,
  maxX: screenToWorld(dimensions.width, 0, viewport).x,
  minZ: screenToWorld(0, 0, viewport).z,
  maxZ: screenToWorld(0, dimensions.height, viewport).z
};

// Generate grid points only in visible area
for (let x = Math.floor(visibleWorldArea.minX / gridSpacing) * gridSpacing; 
     x <= visibleWorldArea.maxX; 
     x += gridSpacing) {
  for (let z = Math.floor(visibleWorldArea.minZ / gridSpacing) * gridSpacing; 
       z <= visibleWorldArea.maxZ; 
       z += gridSpacing) {
    gridPoints.push([x, z]);
  }
}
```

## Performance Considerations

### Efficient Grid Rendering
- Only render grid points in visible area
- Use transform instead of recalculating all coordinates
- Implement viewport culling for large models

### Smooth Interactions
- Use `requestAnimationFrame` for smooth pan/zoom updates
- Debounce grid recalculation during rapid zoom changes
- Optimize SVG rendering with `vector-effect="non-scaling-stroke"`

## Integration with Existing Features

### Mode Compatibility
- Pan and zoom work in all application modes
- Node placement accuracy maintained across zoom levels
- Cursor coordinate tracking updates in real-time

### Model Persistence
- Viewport state is session-specific (not saved with model)
- New models start with default viewport (zoom=1.0, pan=0,0)
- Existing models load with default viewport

### JBeam Compatibility
- All model coordinates remain in world space
- JBeam export/import unaffected by viewport transformations
- Cross-platform compatibility maintained

## Edge Cases and Constraints

### Zoom Limits
- Minimum zoom: 1e-8 (0.00000001) for dimensionless structural analysis
- Maximum zoom: 1e+8 (100,000,000) for dimensionless structural analysis
- JavaScript double-precision floating point maintains accuracy within this range
- Grid spacing adapts to maintain visibility across extreme zoom levels

### Pan Limits
- No hard pan limits (allow unlimited navigation)
- Provide "Zoom to Fit" function to return to model bounds
- Consider soft limits based on model extents (future)

### Browser Compatibility
- Test middle mouse button behavior across browsers
- Handle touchpad scroll vs mouse wheel differences
- Ensure Ctrl+wheel doesn't trigger browser zoom

## Testing Strategy

### Interaction Testing
- Test middle mouse drag panning in all modes
- Verify Ctrl+wheel zoom around cursor position
- Test menu zoom functions around viewport center
- Validate coordinate accuracy at different zoom levels

### Grid Behavior
- Verify grid spacing adapts smoothly during zoom
- Test grid performance with large viewport areas
- Ensure grid remains visible at all zoom levels

### Cross-browser Testing
- Test on Chrome, Firefox, Safari, Edge
- Verify touch device behavior (future consideration)
- Test with different mouse/trackpad configurations

## Future Enhancements

### Advanced Navigation
- Zoom to selection (when selection is implemented)
- Pan to specific coordinates
- Viewport bookmarks/saved views
- Mini-map for large models

### Touch Support
- Two-finger pan and zoom gestures
- Touch-compatible interaction modes
- Mobile-responsive navigation

### Performance Optimizations
- Level-of-detail rendering for large models
- Viewport-based culling for complex scenes
- WebGL rendering for high-performance graphics

## Implementation Tasks

1. **Core Viewport State**
   - Add viewport state to App component
   - Implement coordinate transformation utilities
   - Add SVG transform-based rendering

2. **Pan Implementation**
   - Add middle mouse button drag handling
   - Implement pan state management
   - Add pan cursor styling

3. **Zoom Implementation**
   - Add Ctrl+wheel zoom handling
   - Implement zoom around cursor position
   - Add menu zoom functions

4. **Grid System Updates**
   - Implement adaptive grid spacing calculation
   - Update grid rendering for world coordinates
   - Add viewport culling for performance

5. **UI Integration**
   - Add View menu with zoom controls
   - Update status bar with zoom information
   - Ensure mode compatibility

6. **Coordinate System Updates**
   - Update node placement to use world coordinates
   - Update cursor tracking for world coordinates
   - Maintain model coordinate accuracy

7. **Testing and Polish**
   - Test across different browsers and devices
   - Optimize performance for large models
   - Add keyboard shortcuts for zoom operations

## Consequences

### Positive
- **Enhanced Navigation**: Users can navigate and work with large models
- **Extreme Zoom Range**: 1e-8 to 1e+8 zoom levels support dimensionless structural analysis
- **Numerical Stability**: Manual transform approach avoids SVG precision limits
- **Universal Compatibility**: Pan/zoom works in all application modes
- **Adaptive Interface**: Grid remains useful at all zoom levels
- **Industry Standard**: Familiar pan/zoom interactions from CAD software
- **JavaScript Precision**: Double-precision floating point maintains accuracy

### Negative
- **Manual Transform Overhead**: All coordinates must be transformed for rendering
- **Increased CPU Usage**: More calculations per frame compared to SVG transforms
- **Testing Burden**: More interaction scenarios and extreme zoom levels to test
- **Browser Differences**: Middle mouse and Ctrl+wheel behavior varies
- **Performance Impact**: Large models with many elements require optimization
- **Learning Curve**: Users need to understand viewport navigation

### Technical Trade-offs
- **Performance vs Precision**: Manual transforms sacrifice some performance for numerical accuracy
- **Memory vs Speed**: Pre-computed screen coordinates vs real-time transformation
- **Complexity vs Capability**: More complex implementation enables extreme zoom capabilities

### Neutral
- **Coordinate System**: World vs screen coordinates require careful handling
- **Model Compatibility**: Viewport state separate from model data
- **Memory Usage**: Viewport state adds to application memory footprint