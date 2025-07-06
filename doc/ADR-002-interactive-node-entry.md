# ADR-002: Interactive Node Entry and Model Management

## Status
Proposed

## Context
JSBeam needs to evolve from a static grid display to an interactive structural modeling application. Users need to:
- Switch between different interaction modes (select, node entry, future: beam entry, load entry)
- Place structural nodes by clicking in the content area
- Track cursor coordinates and application state
- Support multiple independent model instances (different browser tabs/windows)
- Maintain extensibility for future structural analysis features

This is the foundation for a plane frame and truss calculation web application, so the architecture must support:
- Complex structural elements (nodes, beams, supports, loads)
- Multiple analysis models
- Real-time coordinate tracking
- Mode-based interactions

## Decision
Implement a comprehensive model management and interaction system using:

1. **Application Mode Management**: Central mode state with extensible mode system
2. **Model-based Architecture**: Each instance manages its own structural model
3. **Coordinate System**: World coordinates with grid snapping and real-time tracking
4. **Event-driven Interactions**: Mode-specific click handlers and cursor tracking
5. **Persistent Model Storage**: Instance-specific localStorage with unique model IDs

## Implementation Strategy

### Mode Management
- Add `applicationMode` state to App component (`select`, `addNode`, future: `addBeam`, `addLoad`)
- Mode-specific interaction handlers in ContentArea
- Visual mode indicators in status bar and potentially toolbar
- Keyboard shortcuts for mode switching

### Model Data Structure
```javascript
{
  id: 'unique-model-id',
  name: 'Model Name',
  nodes: [
    {
      id: 'node-1',
      x: 100,
      y: 200,
      constraints: { dx: false, dy: false, rotation: false },
      properties: { type: 'free' } // future: support, load point
    }
  ],
  elements: [], // future: beams, trusses
  loads: [],   // future: point loads, distributed loads
  metadata: {
    gridSize: 20,
    units: 'mm',
    created: Date,
    modified: Date
  }
}
```

### Coordinate System
- World coordinates in pixels, origin at top-left
- Grid snapping optional (future feature)
- Real-time cursor tracking with coordinate display
- Viewport-independent coordinates for model persistence

### State Management
- Model state in App component
- Mode state in App component
- Cursor coordinates tracked in ContentArea
- Event propagation from ContentArea to App for model updates

### Multi-Instance Support
- Generate unique model IDs using timestamps/UUIDs
- Store models in localStorage with `jsbeam-model-${id}` keys
- Allow model switching/loading (future: File menu)
- Prevent cross-instance interference

## Technical Details

### Mode System
```javascript
const MODES = {
  SELECT: 'select',
  ADD_NODE: 'addNode',
  // Future: ADD_BEAM, ADD_LOAD, EDIT, etc.
};

const [applicationMode, setApplicationMode] = useState(MODES.SELECT);
```

### Node Placement
```javascript
const handleContentClick = (event) => {
  if (applicationMode === MODES.ADD_NODE) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    addNode({ x, y });
  }
};
```

### Model Persistence
```javascript
const saveModel = (model) => {
  localStorage.setItem(`jsbeam-model-${model.id}`, JSON.stringify(model));
};

const loadModel = (modelId) => {
  const stored = localStorage.getItem(`jsbeam-model-${modelId}`);
  return stored ? JSON.parse(stored) : null;
};
```

### Node Rendering
```javascript
// In ContentArea SVG
{model.nodes.map(node => html`
  <circle
    cx=${node.x}
    cy=${node.y}
    r="6"
    fill="none"
    stroke="var(--accent-color)"
    stroke-width="2"
    class="node"
  />
`)}
```

## UI Changes

### Menu System
- Add "Mode" menu or toolbar for mode switching
- File menu: New Model, Save Model, Load Model (future)
- Edit menu: Delete Node, Move Node (future)

### Status Bar Enhancements
- Display current mode: "Mode: Select" / "Mode: Add Node"
- Display cursor coordinates: "X: 123, Y: 456"
- Display model info: "Nodes: 5, Elements: 0"

### Content Area
- Mode-specific cursor styling
- Node selection highlighting (future)
- Hover effects for interactive elements

## Future Extensibility

### Additional Modes
- `addBeam`: Connect two nodes with beam element
- `addLoad`: Add point or distributed loads
- `addSupport`: Add boundary conditions
- `edit`: Modify existing elements
- `analyze`: Run structural analysis

### Element Types
- Beams with material properties
- Trusses (pin-connected members)
- Supports (fixed, pinned, roller)
- Loads (point, distributed, moment)

### Analysis Integration
- Finite element analysis modules
- Results visualization
- Load combinations and cases

## Alternatives Considered

1. **Single Global Model**
   - Rejected: Doesn't support multiple model instances
   
2. **File-based Model Storage**
   - Deferred: Requires more complex file handling, start with localStorage
   
3. **Canvas-based Rendering**
   - Rejected: SVG provides better styling, accessibility, and DOM integration

4. **External State Management (Redux/Zustand)**
   - Rejected: Adds complexity, React hooks sufficient for current scope

## Consequences

### Positive
- Clear separation of concerns between UI and model
- Extensible architecture for future features
- Multi-instance support from the start
- Mode-based interactions enable complex workflows
- Foundation for structural analysis capabilities

### Negative
- Increased complexity in state management
- Need for careful coordinate system handling
- More testing required for mode interactions
- localStorage limitations for large models

## Implementation Tasks
1. Add mode management to App component
2. Implement model data structure and persistence
3. Add coordinate tracking in ContentArea
4. Implement node placement in addNode mode
5. Update StatusBar to show mode and coordinates
6. Add node rendering in SVG
7. Add mode switching UI (menu or toolbar)
8. Implement model saving/loading
9. Add keyboard shortcuts for mode switching
10. Test multi-instance behavior

## Testing Considerations
- Test all modes in different browsers
- Verify coordinate accuracy across viewports
- Test localStorage persistence and cleanup
- Verify multi-instance isolation
- Test keyboard shortcuts and accessibility