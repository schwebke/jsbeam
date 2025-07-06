# ADR-005: Module Decomposition

## Status
Proposed

## Context
JSBeam's main.js has grown to approximately 1,000 lines and contains multiple concerns mixed together. With upcoming features (beam entry, property editing for three beam types, static/dynamic analysis, and results visualization), the codebase will continue to grow significantly.

**Current main.js contains:**
- Application state management and main App component
- UI components (MenuBar, ContentArea, StatusBar, NodePropertiesEditor)
- Data model structures and validation
- Rendering logic for nodes, grid, and visual symbols
- Interaction handlers for viewport, modes, and selection
- Utility functions for coordinates, validation, and storage

**Upcoming features that will add complexity:**
- Three different beam types with property editors
- Static and dynamic structural analysis calculations
- Results visualization (displacement figures, moments, shear/normal forces)
- Beam entry and connection logic
- Enhanced selection and editing capabilities

**No-build constraint**: JSBeam uses a no-build workflow with native ES modules, requiring any decomposition to work with direct browser imports via import maps.

## Decision
Decompose main.js into six focused modules using a single-level structure that maintains the no-build approach:

1. **main.js** - Core application orchestration
2. **ui-components.js** - All UI components and interfaces
3. **model.js** - Data model structures and validation
4. **render.js** - All rendering logic and visual representation
5. **interact.js** - Interaction handlers and event management
6. **util.js** - Utilities and helper functions

## Implementation Strategy

### Module Responsibilities

#### main.js (Core Application)
- App component with top-level state management
- Module imports and orchestration
- Global application lifecycle
- Theme and settings management
- URL-based model management

```javascript
import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';
import { MenuBar, ContentArea, StatusBar, NodePropertiesEditor } from './ui-components.js';
import { createModel, validateModel, updateModel } from './model.js';
import { screenToWorld, worldToScreen } from './util.js';

export function App() {
  // Core application state
  // Module orchestration
  // Theme management
  // URL management
}
```

#### ui-components.js (UI Components)
- MenuBar component with dropdown menus
- ContentArea component with SVG container
- StatusBar component with coordinate display
- NodePropertiesEditor modal component
- BeamPropertiesEditor modal component (future)
- Common UI elements and form controls

```javascript
import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';
import { validateNodeProperties } from './model.js';
import { renderNodes, renderGrid, renderBeams } from './render.js';
import { handleViewportInteraction, handleModeInteraction } from './interact.js';

export function MenuBar({ ... }) { /* MenuBar implementation */ }
export function ContentArea({ ... }) { /* ContentArea implementation */ }
export function StatusBar({ ... }) { /* StatusBar implementation */ }
export function NodePropertiesEditor({ ... }) { /* Property editor implementation */ }
```

#### model.js (Data Model)
- Model structure definition and creation
- Node data structures and validation
- Beam data structures and validation (future)
- Results data structures (future)
- JBeam compatibility validation
- Model persistence and serialization

```javascript
// JBeam-compatible model structure
export const createModel = (id) => ({
  id,
  name: `Model ${id}`,
  nodes: [],
  beams: [],
  loads: [],
  constraints: [],
  results: null
});

export const createNode = (coordinates, id) => ({
  id,
  label: `N${id}`,
  coordinates: { x: coordinates.x, z: coordinates.z },
  constraints: { x: false, z: false, r: false },
  loads: { fx: 0, fz: 0, m: 0 }
});

export const validateNodeProperties = (properties) => {
  // Validation logic
};

export const updateNodeInModel = (model, nodeId, properties) => {
  // Model update logic
};
```

#### render.js (Rendering System)
- Node visual representation and symbols
- Grid rendering with adaptive spacing
- Beam rendering (future)
- Results visualization (future)
- SVG marker definitions and styling
- Viewport transformation integration

```javascript
import { worldToScreen, calculateGridSpacing } from './util.js';

export const renderNodes = (nodes, viewport, dimensions) => {
  // Node rendering with constraints, forces, moments
};

export const renderGrid = (viewport, dimensions) => {
  // Adaptive grid rendering
};

export const renderBeams = (beams, viewport, dimensions) => {
  // Beam rendering (future)
};

export const renderResults = (results, viewport, dimensions) => {
  // Results visualization (future)
};

// SVG marker definitions
export const svgMarkers = html`
  <defs>
    <marker id="arrowhead" markerWidth="3" markerHeight="2.5" refX="3" refY="1.25" orient="auto">
      <polygon points="0 0, 3 1.25, 0 2.5" fill="none" stroke="var(--moment-color)" stroke-width="1" />
    </marker>
  </defs>
`;
```

#### interact.js (Interaction Handlers)
- Viewport pan and zoom handling
- Application mode management
- Node selection and editing
- Beam entry interactions (future)
- Mouse and keyboard event handling
- Touch interaction support (future)

```javascript
import { screenToWorld, worldToScreen } from './util.js';

export const handleViewportInteraction = (event, viewport, setViewport) => {
  // Pan and zoom logic
};

export const handleModeInteraction = (event, mode, model, setModel) => {
  // Mode-specific interaction handling
};

export const handleNodeSelection = (event, node, onSelect) => {
  // Node selection and right-click handling
};

export const handleBeamEntry = (event, mode, model, setModel) => {
  // Beam entry logic (future)
};
```

#### util.js (Utilities)
- Coordinate system transformations
- Validation utilities
- Storage and persistence
- Mathematical calculations
- Performance optimizations

```javascript
// Coordinate transformations
export const screenToWorld = (screenX, screenZ, viewport, dimensions) => {
  // Transform screen coordinates to world coordinates
};

export const worldToScreen = (worldX, worldZ, viewport, dimensions) => {
  // Transform world coordinates to screen coordinates
};

// Grid utilities
export const calculateGridSpacing = (baseGridSize, zoom) => {
  // Adaptive grid spacing calculation
};

// Validation utilities
export const validateCoordinates = (x, z) => {
  // Coordinate validation
};

// Storage utilities
export const saveModelToStorage = (model) => {
  // Local storage persistence
};

export const loadModelFromStorage = (modelId) => {
  // Local storage retrieval
};
```

### Import Map Updates
Update static/index.html to include the new modules:

```html
<script type="importmap">
{
  "imports": {
    "htm/preact": "https://esm.sh/htm@3.1.1/preact",
    "preact": "https://esm.sh/preact@10.23.2",
    "preact/hooks": "https://esm.sh/preact@10.23.2/hooks",
    "./ui-components.js": "./ui-components.js",
    "./model.js": "./model.js",
    "./render.js": "./render.js",
    "./interact.js": "./interact.js",
    "./util.js": "./util.js"
  }
}
</script>
```

## Migration Strategy

### Phase 1: Extract Core Utilities
1. Create util.js with coordinate transformations
2. Move validation functions to util.js
3. Update main.js to import from util.js
4. Test all existing functionality

### Phase 2: Extract Data Model
1. Create model.js with data structures
2. Move model creation and validation logic
3. Update main.js to use model.js
4. Verify JBeam compatibility

### Phase 3: Extract Rendering System
1. Create render.js with node rendering
2. Move grid rendering and SVG utilities
3. Update main.js to use render.js
4. Test visual representation accuracy

### Phase 4: Extract Interaction Handlers
1. Create interact.js with event handlers
2. Move viewport and mode interaction logic
3. Update main.js to use interact.js
4. Test all interaction behaviors

### Phase 5: Extract UI Components
1. Create ui-components.js with React components
2. Move MenuBar, ContentArea, StatusBar, PropertyEditor
3. Update main.js to import components
4. Test complete UI functionality

### Phase 6: Finalize Core
1. Reduce main.js to core orchestration
2. Remove redundant code and imports
3. Optimize module boundaries
4. Complete integration testing

## Benefits

### Code Organization
- **Single Responsibility**: Each module has a focused purpose
- **Clear Dependencies**: Explicit imports show module relationships
- **Maintainability**: Easier to locate and modify specific functionality
- **Testability**: Individual modules can be tested in isolation

### Development Experience
- **Reduced Complexity**: Smaller files are easier to understand
- **Parallel Development**: Different features can be worked on simultaneously
- **Code Reuse**: Utilities and components can be shared across modules
- **Debugging**: Issues are easier to isolate and fix

### Future Scalability
- **Beam Features**: New beam types can be added to model.js and render.js
- **Analysis Engine**: Structural analysis can be added as separate modules
- **Results Visualization**: Results rendering can extend render.js
- **UI Enhancement**: New components can be added to ui-components.js

## Considerations

### No-Build Constraints
- **Import Maps**: All modules must be explicitly declared
- **Browser Compatibility**: ES modules require modern browsers
- **Development Server**: Local development still requires HTTP server
- **Debugging**: Source maps not available without build tools

### Performance
- **Network Requests**: Additional HTTP requests for each module
- **Caching**: Browser caching improves subsequent loads
- **Bundle Size**: Total JavaScript size unchanged, but split
- **Load Order**: Modules load in dependency order

### Maintenance
- **Circular Dependencies**: Must be avoided in module design
- **Interface Stability**: Module APIs should be stable
- **Documentation**: Each module needs clear documentation
- **Testing**: Integration testing becomes more important

## Alternatives Considered

### 1. Three-Level Decomposition
- **Structure**: main.js → categories → specific modules
- **Example**: ui/ → components/, interactions/, rendering/
- **Rejected**: Adds complexity without significant benefit for no-build approach

### 2. Feature-Based Modules
- **Structure**: nodes.js, beams.js, analysis.js, results.js
- **Rejected**: Creates tight coupling and unclear boundaries

### 3. Component-Per-File
- **Structure**: MenuBar.js, ContentArea.js, StatusBar.js, etc.
- **Rejected**: Too many files for no-build approach, import map complexity

### 4. Keep Single File
- **Structure**: Maintain current main.js structure
- **Rejected**: Unmanageable complexity for upcoming features

## Implementation Tasks

1. **Utility Extraction**
   - Create util.js with coordinate transformations
   - Move validation and storage functions
   - Update main.js imports

2. **Model Extraction**
   - Create model.js with data structures
   - Move model creation and validation
   - Ensure JBeam compatibility

3. **Rendering Extraction**
   - Create render.js with visual logic
   - Move node and grid rendering
   - Maintain visual accuracy

4. **Interaction Extraction**
   - Create interact.js with event handlers
   - Move viewport and mode logic
   - Preserve interaction behavior

5. **UI Component Extraction**
   - Create ui-components.js with React components
   - Move all UI components
   - Maintain component functionality

6. **Core Optimization**
   - Reduce main.js to orchestration
   - Clean up redundant code
   - Optimize module boundaries

7. **Testing and Integration**
   - Test each module individually
   - Verify complete application functionality
   - Performance testing and optimization

## Consequences

### Positive
- **Improved Code Organization**: Clear separation of concerns
- **Enhanced Maintainability**: Easier to understand and modify
- **Better Development Experience**: Focused modules, parallel development
- **Future-Ready Architecture**: Prepared for upcoming features
- **Preserved No-Build Workflow**: Maintains development simplicity

### Negative
- **Additional Complexity**: More files and imports to manage
- **Network Overhead**: Additional HTTP requests for modules
- **Integration Testing**: More complex testing scenarios
- **Learning Curve**: Developers need to understand module boundaries

### Neutral
- **Total Code Size**: Unchanged, just reorganized
- **Browser Compatibility**: Still requires modern ES module support
- **Development Workflow**: Still uses native browser loading
- **JBeam Compatibility**: Maintained through careful migration

## Risk Mitigation

### Functionality Risks
- **Incremental Migration**: Migrate one module at a time
- **Regression Testing**: Test after each migration step
- **Rollback Plan**: Keep backup of working main.js

### Performance Risks
- **HTTP/2 Optimization**: Leverage browser connection multiplexing
- **Module Preloading**: Use link rel="modulepreload" if needed
- **Caching Strategy**: Ensure proper cache headers

### Maintenance Risks
- **Clear Documentation**: Document module APIs and boundaries
- **Interface Contracts**: Define stable APIs between modules
- **Dependency Management**: Avoid circular dependencies

This decomposition provides a solid foundation for JSBeam's continued growth while maintaining the no-build philosophy and preparing for advanced structural analysis features.