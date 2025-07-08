# ADR-006: Truss Entry Implementation

## Status
Proposed

## Context

JSBeam needs the ability to create truss elements that connect two nodes, following the JBeam schema specification. Truss elements are fundamental structural components that carry only axial forces (tension/compression) and are essential for creating truss structures and frames.

**Current State**: JSBeam has implemented node placement and editing capabilities, but lacks the ability to create structural connections between nodes.

**Requirements**:
- JBeam schema compliance for truss elements (TrussBeam type)
- Intuitive two-phase selection process (start node → end node)
- Visual feedback during element creation (rubber band preview)
- Integration with existing viewport controls (pan/zoom)
- Proper cancellation mechanisms (Esc key, mode changes)
- Distinct visual representation from nodes and grid elements

**User Workflow**:
1. User selects "Add Truss" mode from Mode menu
2. User clicks on a start node (cursor changes, node highlights)
3. User moves mouse to show rubber band preview to potential end node
4. User clicks on end node to complete truss creation
5. Truss appears with permanent styling, distinct from preview

## Decision

Implement truss entry using a **two-phase selection system** with **rubber band preview** that maintains full compatibility with the JBeam schema and preserves existing interaction patterns.

### Core Design Principles

1. **JBeam Schema Compliance**: Use TrussBeam structure with `nodeIds` array, `type: "truss"`, and material properties
2. **Two-Phase Interaction**: Distinct start and end node selection phases with clear visual feedback
3. **Non-Blocking Navigation**: Pan and zoom remain functional throughout truss entry process
4. **Consistent Cancellation**: Esc key and mode changes cancel current operation at any phase
5. **Visual Clarity**: Distinct colors for trusses, preview rubber band, and interaction states

### Application Mode Extensions

**New Modes**:
- `ADD_TRUSS: 'addTruss'` - Main truss entry mode
- Truss selection states: `SELECTING_START_NODE`, `SELECTING_END_NODE`

**Mode Transitions**:
- Select → Add Truss: Enter truss mode, wait for start node
- Add Truss → Select: Cancel any in-progress truss creation
- Add Node → Add Truss: Switch modes, cancel previous operation
- Esc key: Always return to Select mode, cancel current operation

### Data Model Design

**Truss Structure** (JBeam TrussBeam compliant):
```javascript
{
  id: "truss-1234567890",
  type: "truss",
  label: "",
  nodeIds: ["node-start", "node-end"],
  material: {
    EA: 210000  // Default axial stiffness (steel: 210 GPa * 1000 mm²)
  },
  mass: 0.0
}
```

**Validation Rules**:
- Start and end nodes must exist in model
- Start and end nodes must be different
- No duplicate trusses between same node pair
- NodeIds must reference valid node IDs

### Visual Design System

**Color Scheme**:
- Trusses: `--truss-color: #2196f3` (distinct blue)
- Rubber band preview: `--truss-preview-color: rgba(33, 150, 243, 0.5)` (50% opacity)
- Node hover during truss mode: Enhanced accent color
- Selected start node: Persistent highlight until end node selected

**Styling Details**:
- Truss line width: 3px (thicker than grid, thinner than constraint symbols)
- Rubber band: 2px dashed line with 50% opacity
- Cursor in truss mode: `crosshair`
- Node hover radius increases by 2px during selection

### Interaction Specification

**Phase 1: Start Node Selection**
- Enter Add Truss mode → cursor changes to crosshair
- Hover over nodes → nodes highlight with enhanced accent color
- Click on node → node becomes persistently highlighted as start node
- Move to Phase 2: End Node Selection

**Phase 2: End Node Selection**
- Mouse movement → rubber band line from start node to cursor position
- Rubber band visible even when start node is off-screen
- Hover over nodes → end node candidates highlight
- Click on different node → complete truss creation, return to Phase 1
- Click on same node → ignore (no self-connecting trusses)

**Viewport Navigation During Truss Mode**:
- Middle mouse drag: Pan viewport (rubber band updates correctly)
- Ctrl+wheel: Zoom viewport (rubber band scales appropriately)
- View menu controls: All zoom functions remain available
- Rubber band line always connects start node to current cursor position

**Cancellation Mechanisms**:
- Esc key: Cancel current operation, return to Select mode
- Mode menu selection: Cancel current operation, switch to new mode
- File → New: Cancel current operation, create new model

### Implementation Architecture

**Module Responsibilities**:

1. **util.js**:
   - Add `ADD_TRUSS` to MODES enum
   - Add truss validation utilities
   - Add truss color constants

2. **model.js**:
   - `createTruss(startNodeId, endNodeId, id)` function
   - `addTrussToModel(model, startNodeId, endNodeId)` function
   - `validateTruss(truss, nodes)` function
   - Update model validation to include truss validation

3. **render.js**:
   - `renderTruss(truss, startNode, endNode, viewport, dimensions)` function
   - `renderTrussPreview(startNode, mousePosition, viewport, dimensions)` function
   - Update `renderBeams` to handle truss type elements
   - Add truss-specific SVG styling

4. **interact.js**:
   - `createTrussHandler(applicationMode, model, setModel, viewport, dimensions)` function
   - Enhanced node hit testing for truss mode
   - Truss mode state management (start node selection, preview)
   - Integration with existing pan/zoom controls

5. **ui-components.js**:
   - Add "Add Truss" to Mode menu dropdown
   - Update `ContentArea` component for truss interaction handling
   - Render rubber band preview during end node selection
   - Update cursor styling based on mode

6. **main.js**:
   - Add truss mode state management
   - `addTruss(startNodeId, endNodeId)` function
   - Truss mode transition handling
   - Integration with existing keyboard shortcuts

### Keyboard Shortcuts

**New Shortcuts**:
- `Ctrl+3`: Switch to Add Truss mode
- `Esc`: Cancel current truss operation, return to Select mode

**Existing Shortcuts** (preserved):
- `Ctrl+1`: Select mode
- `Ctrl+2`: Add Node mode

### Error Handling

**User Input Validation**:
- Clicking same node twice: Ignore, remain in end node selection
- Clicking non-existent area: Continue in current phase
- Attempting to create duplicate truss: Show warning, cancel operation

**Edge Cases**:
- Start node deleted during end selection: Cancel operation, return to Select mode
- Model cleared during truss creation: Cancel operation automatically
- Window resize during preview: Rubber band position updates correctly

## Implementation Tasks

### Phase 1: Core Infrastructure
1. **Extend application modes and data model**
   - Add ADD_TRUSS mode to util.js
   - Update createTruss function in model.js to match JBeam schema
   - Add truss validation functions

2. **Add visual styling system**
   - Define truss color variables in styles.css
   - Add cursor styling for truss mode
   - Create rubber band preview styles

### Phase 2: Rendering System
3. **Implement truss rendering**
   - Create renderTruss function for permanent trusses
   - Create renderTrussPreview function for rubber band
   - Update beam rendering to handle truss elements

### Phase 3: Interaction System
4. **Build truss interaction handlers**
   - Create two-phase selection logic
   - Implement rubber band preview updates
   - Ensure pan/zoom integration

### Phase 4: UI Integration
5. **Update user interface components**
   - Add Add Truss to Mode menu
   - Update ContentArea for truss interactions
   - Integrate rubber band preview rendering

### Phase 5: Application Integration
6. **Connect to main application**
   - Add truss mode state management
   - Implement addTruss function
   - Add keyboard shortcuts
   - Update status bar for truss mode

## Benefits

### User Experience
- **Intuitive Workflow**: Two-phase selection matches common CAD software patterns
- **Visual Feedback**: Rubber band preview shows exactly what will be created
- **Non-Disruptive**: Pan and zoom continue working during truss creation
- **Consistent Cancellation**: Esc key works as expected throughout the process

### Technical Benefits
- **JBeam Compatibility**: Full compliance with JBeam schema for data interchange
- **Modular Architecture**: Changes isolated to appropriate modules
- **Extensible Design**: Pattern can be reused for other connection types (beams, cables)
- **Performance**: Rubber band updates only on mouse move, minimal rendering overhead

### Future Extensibility
- **Beam Types**: Same interaction pattern for Euler-Bernoulli beams
- **Constraints**: Similar approach for rigid connections
- **Analysis Integration**: Truss data ready for structural analysis calculations

## Considerations

### Performance
- **Rubber Band Rendering**: Efficient SVG line updates on mouse move
- **Hit Testing**: Optimized node selection with reasonable tolerance zones
- **Memory Usage**: Minimal additional state for truss mode management

### User Interface
- **Mode Indication**: Clear visual feedback about current mode and phase
- **Error Prevention**: Validation prevents invalid truss creation attempts
- **Accessibility**: Keyboard shortcuts provide alternative interaction method

### Technical Complexity
- **State Management**: Careful handling of two-phase selection state
- **Edge Cases**: Proper cleanup when operations are interrupted
- **Integration**: Seamless integration with existing interaction patterns

## Alternatives Considered

### 1. Single-Click Truss Creation
- **Approach**: Click to start, click to end in single operation
- **Rejected**: No preview feedback, less intuitive for users

### 2. Drag-and-Drop Interface
- **Approach**: Click and drag from start node to end node
- **Rejected**: Conflicts with existing pan interaction (middle mouse drag)

### 3. Command-Line Style Entry
- **Approach**: Type node IDs to create connections
- **Rejected**: Not suitable for visual/interactive interface

### 4. Multi-Select + Connect
- **Approach**: Select multiple nodes, then connect all
- **Rejected**: Too complex for simple two-node connections

## Future Enhancements

### Short Term
- **Truss Properties Editor**: Right-click properties dialog for material settings
- **Multiple Truss Types**: Different truss materials and cross-sections
- **Visual Indicators**: Load path visualization and stress indicators

### Long Term
- **Beam Elements**: Extend pattern to full frame elements with moment capacity
- **Advanced Analysis**: Integration with structural analysis for truss forces
- **Construction Sequences**: Staged construction modeling capabilities

This design provides a solid foundation for truss entry while maintaining JSBeam's modular architecture and user experience principles.