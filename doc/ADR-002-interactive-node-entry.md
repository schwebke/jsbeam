# ADR-002: Interactive Node Entry and Model Management

## Status
Implemented

## Context
JSBeam needs to evolve from a static grid display to an interactive structural modeling application. Users need to:
- Switch between different interaction modes (select, node entry, future: beam entry, load entry)
- Place structural nodes by clicking in the content area
- Track cursor coordinates and application state
- Support multiple independent model instances (different browser tabs/windows)
- Maintain extensibility for future structural analysis features

**Critical Requirement**: JSBeam must use the same model file format and algorithms as JBeam (Java-based twin application) to ensure compatibility and data interchange.

JBeam uses a specific JSON schema for structural models with:
- 2D coordinate system (x, z axes)
- Nodes with constraints, loads, and displacements
- Beam elements (truss, ebbeam, ebsbeam) with material properties
- Unique ID system for all elements
- Version and model type metadata

This architecture must support:
- JBeam JSON format compatibility
- Structural analysis algorithms consistency
- Cross-platform model file exchange
- Real-time coordinate tracking
- Mode-based interactions

## Decision
Implement a comprehensive model management and interaction system using:

1. **JBeam JSON Format Compatibility**: Adopt JBeam's JSON schema for all model data
2. **2D Coordinate System**: Use x-z coordinate system (not x-y) matching JBeam convention
3. **Application Mode Management**: Central mode state with extensible mode system
4. **Model-based Architecture**: Each instance manages its own JBeam-compatible structural model
5. **Event-driven Interactions**: Mode-specific click handlers and cursor tracking
6. **Persistent Model Storage**: Instance-specific localStorage with JBeam JSON format

## Implementation Strategy

### Mode Management
- Add `applicationMode` state to App component (`select`, `addNode`, future: `addBeam`, `addLoad`)
- Mode-specific interaction handlers in ContentArea
- Visual mode indicators in status bar and potentially toolbar
- Keyboard shortcuts for mode switching

### Model Data Structure (JBeam JSON Format)
```javascript
{
  version: "1.0",
  modelType: "structural",
  nodes: [
    {
      id: "node-1",
      x: 100.0,
      z: 200.0,
      constraints: {
        x: false,    // cX - constrained in x direction
        z: false,    // cZ - constrained in z direction
        r: false     // cR - rotational constraint
      },
      loads: {
        fx: 0.0,     // Force in x direction
        fz: 0.0,     // Force in z direction
        m: 0.0       // Moment
      },
      label: "Node 1"
    }
  ],
  beams: [
    {
      type: "ebbeam",  // truss, ebbeam, ebsbeam
      id: "beam-1",
      nodeIds: ["node-1", "node-2"],
      mass: 0.0,
      materialProperties: {
        EA: 210000.0,  // Axial stiffness
        EI: 8750.0     // Flexural stiffness
      },
      distributedLoads: [],
      internalHinges: {
        left: { m: false },   // Moment release at left end
        right: { m: false }   // Moment release at right end
      }
    }
  ],
  // JSBeam-specific metadata (not in JBeam schema)
  metadata: {
    created: "2025-01-01T00:00:00Z",
    modified: "2025-01-01T00:00:00Z",
    gridSize: 20,
    units: "mm"
  }
}
```

### Coordinate System
- **JBeam Convention**: x-z coordinate system (horizontal-vertical, not x-y)
- Screen coordinates: x-right, z-down (matching typical structural analysis convention)
- World coordinates in model units, grid-aligned for precision
- Grid snapping optional (future feature)
- Real-time cursor tracking with x-z coordinate display
- Viewport-independent coordinates for model persistence
- Note: Screen z-axis points down, structural z-axis typically points up (coordinate transformation needed)

### State Management
- Model state in App component
- Mode state in App component
- Cursor coordinates tracked in ContentArea
- Event propagation from ContentArea to App for model updates

### Multi-Instance Support
- Generate unique model IDs using timestamps/UUIDs
- Store JBeam-compatible models in localStorage with `jsbeam-model-${id}` keys
- Allow model switching/loading (future: File menu with JBeam JSON import/export)
- Prevent cross-instance interference
- Support JBeam file format for model sharing between JSBeam and JBeam

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
    const z = event.clientY - rect.top;  // z-axis points down in screen coordinates
    
    addNode({ 
      x: x, 
      z: z, 
      constraints: { x: false, z: false, r: false },
      loads: { fx: 0.0, fz: 0.0, m: 0.0 },
      label: `Node ${nodeCount + 1}`
    });
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
    cy=${node.z}  // z-coordinate for vertical position
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
- Display cursor coordinates: "X: 123, Z: 456" (using x-z convention)
- Display model info: "Nodes: 5, Beams: 0"

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

### Element Types (JBeam Compatible)
- **Truss elements**: Axial-only members with EA stiffness
- **Euler-Bernoulli beams**: Bending + axial with EA, EI properties
- **Euler-Bernoulli with shear**: Full beam behavior with EA, EI, GA properties
- **Constraints**: Fixed, pinned, roller supports
- **Loads**: Point forces, moments, distributed loads
- **Internal hinges**: Moment releases at beam ends

### Analysis Integration
- **JBeam algorithm compatibility**: Same finite element formulation
- **Results visualization**: Displacements, reactions, internal forces
- **Load combinations**: Multiple load cases and combinations
- **Cross-platform validation**: Results match between JSBeam and JBeam

## JBeam Compatibility Requirements

### File Format
- **JSON Schema**: Use exact JBeam JSON schema for model files (stored in `doc/jbeam-model-schema.json`)
- **Version**: Support JBeam v1.0 format
- **Validation**: Implement schema validation for model integrity using local schema copy
- **Export/Import**: Direct compatibility with JBeam .json files

### Data Structure Mapping
- **Nodes**: x, z coordinates, constraints (x, z, r), loads (fx, fz, m)
- **Beams**: type (truss, ebbeam, ebsbeam), material properties (EA, EI, GA)
- **IDs**: String-based unique identifiers matching JBeam convention
- **Units**: Consistent unit system (force, length, moment)

### Algorithm Compatibility
- **Finite Element Method**: Same stiffness matrix formulation
- **Coordinate System**: 2D structural analysis in x-z plane
- **Boundary Conditions**: Identical constraint application
- **Load Application**: Point loads, distributed loads, moments

## Alternatives Considered

1. **Custom JSBeam Model Format**
   - Rejected: Would break compatibility with JBeam, duplicate development effort
   
2. **Single Global Model**
   - Rejected: Doesn't support multiple model instances
   
3. **File-based Model Storage**
   - Deferred: Requires more complex file handling, start with localStorage
   
4. **Canvas-based Rendering**
   - Rejected: SVG provides better styling, accessibility, and DOM integration

5. **External State Management (Redux/Zustand)**
   - Rejected: Adds complexity, React hooks sufficient for current scope

## Consequences

### Positive
- **JBeam Compatibility**: Full interoperability with Java-based JBeam application
- **Cross-platform Model Sharing**: Models created in JSBeam work in JBeam and vice versa
- **Algorithm Consistency**: Same structural analysis results across platforms
- **Proven Data Structure**: Leverage mature JBeam JSON schema
- **Clear separation of concerns**: UI independent of model structure
- **Extensible architecture**: Foundation for all JBeam features
- **Multi-instance support**: Different models in different browser instances
- **Mode-based interactions**: Intuitive workflow for structural modeling

### Negative
- **Coordinate System Complexity**: x-z convention differs from typical web y-axis
- **Schema Validation Overhead**: Need to validate against JBeam JSON schema
- **Limited Local Storage**: Large models may exceed localStorage limits
- **Algorithm Implementation**: Must replicate JBeam's finite element calculations
- **Testing Complexity**: Cross-platform validation with JBeam required

## Implementation Tasks
1. **JBeam Schema Integration**
   - Use local JBeam JSON schema copy (`doc/jbeam-model-schema.json`) for validation
   - Implement schema validation utilities
   - Create JBeam-compatible model creation functions

2. **Core Architecture**
   - Add mode management to App component
   - Implement JBeam model data structure and persistence
   - Add x-z coordinate tracking in ContentArea
   - Implement node placement in addNode mode

3. **UI Updates**
   - Update StatusBar to show mode and x-z coordinates
   - Add node rendering in SVG (x-z coordinates)
   - Add mode switching UI (menu or toolbar)
   - Implement model saving/loading with JBeam format

4. **JBeam Compatibility**
   - Implement JBeam JSON import/export
   - Add unique ID generation matching JBeam convention
   - Test cross-platform model compatibility

5. **User Experience**
   - Add keyboard shortcuts for mode switching
   - Implement cursor styling for different modes
   - Add coordinate system documentation

## Testing Considerations
- **JBeam Compatibility**: Test models created in JSBeam work in JBeam
- **Cross-platform Validation**: Verify identical results for same models
- **Coordinate System**: Test x-z coordinate accuracy across viewports
- **Multi-instance**: Verify localStorage isolation between instances
- **Mode Switching**: Test all interaction modes in different browsers
- **Schema Validation**: Ensure all created models pass JBeam schema validation