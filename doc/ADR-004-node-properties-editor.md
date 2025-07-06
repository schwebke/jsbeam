# ADR-004: Node Properties Editor and Visual Representation

## Status
Proposed

## Context
JSBeam currently supports basic node placement but lacks the ability to edit node properties or provide meaningful visual feedback about node states. Users need to:
- Edit node properties (position, constraints, loads, labels) after placement
- See visual representation of node constraints, forces, and moments
- Have consistent interaction patterns for property editing
- Switch modes efficiently when editing properties

**JBeam Compatibility**: Node property editing must maintain full compatibility with JBeam's data model and provide equivalent visual representations based on the JBeam NodeRenderer implementation.

The current implementation only shows nodes as simple circles, providing no information about:
- Boundary conditions (constraints in x, z, rotation)
- Applied loads (forces Fx, Fz, moments M)
- Node identification (labels)
- Selection state for editing

## Decision
Implement a comprehensive node properties editor with:

1. **Right-click Property Editor**: Universal right-click to switch to select mode and open property editor
2. **Modal Property Form**: Dedicated form for editing all node properties
3. **Enhanced Node Rendering**: Visual representation based on JBeam NodeRenderer patterns
4. **Model Integration**: Seamless model updates with Apply/Cancel workflow
5. **JBeam Visual Compatibility**: Node symbols matching JBeam's constraint and load representations

## Implementation Strategy

### Right-click Interaction
- Right-click on any node in any mode switches to select mode
- Opens property editor modal for the clicked node
- Prevents default context menu behavior
- Maintains current viewport state during editing

### Property Editor Form
```javascript
const NodePropertiesEditor = ({ node, isOpen, onApply, onCancel }) => {
  const [formData, setFormData] = useState({
    label: node.label,
    coordinates: { x: node.coordinates.x, z: node.coordinates.z },
    constraints: { x: node.constraints.x, z: node.constraints.z, r: node.constraints.r },
    loads: { fx: node.loads.fx, fz: node.loads.fz, m: node.loads.m }
  });

  return html`
    <div class="modal-overlay" onClick=${onCancel}>
      <div class="modal-content node-properties-editor" onClick=${(e) => e.stopPropagation()}>
        <h3>Node Properties: ${node.id}</h3>
        
        <div class="form-section">
          <label>Label:</label>
          <input type="text" value=${formData.label} 
                 onChange=${(e) => setFormData({...formData, label: e.target.value})} />
        </div>
        
        <div class="form-section">
          <h4>Position</h4>
          <label>X: <input type="number" value=${formData.coordinates.x} 
                           onChange=${(e) => setFormData({...formData, coordinates: {...formData.coordinates, x: parseFloat(e.target.value) || 0}})} /></label>
          <label>Z: <input type="number" value=${formData.coordinates.z} 
                           onChange=${(e) => setFormData({...formData, coordinates: {...formData.coordinates, z: parseFloat(e.target.value) || 0}})} /></label>
        </div>
        
        <div class="form-section">
          <h4>Constraints</h4>
          <label><input type="checkbox" checked=${formData.constraints.x} 
                        onChange=${(e) => setFormData({...formData, constraints: {...formData.constraints, x: e.target.checked}})} /> X (Horizontal)</label>
          <label><input type="checkbox" checked=${formData.constraints.z} 
                        onChange=${(e) => setFormData({...formData, constraints: {...formData.constraints, z: e.target.checked}})} /> Z (Vertical)</label>
          <label><input type="checkbox" checked=${formData.constraints.r} 
                        onChange=${(e) => setFormData({...formData, constraints: {...formData.constraints, r: e.target.checked}})} /> R (Rotation)</label>
        </div>
        
        <div class="form-section">
          <h4>Loads</h4>
          <label>Fx: <input type="number" value=${formData.loads.fx} 
                           onChange=${(e) => setFormData({...formData, loads: {...formData.loads, fx: parseFloat(e.target.value) || 0}})} /></label>
          <label>Fz: <input type="number" value=${formData.loads.fz} 
                           onChange=${(e) => setFormData({...formData, loads: {...formData.loads, fz: parseFloat(e.target.value) || 0}})} /></label>
          <label>M: <input type="number" value=${formData.loads.m} 
                          onChange=${(e) => setFormData({...formData, loads: {...formData.loads, m: parseFloat(e.target.value) || 0}})} /></label>
        </div>
        
        <div class="form-actions">
          <button onClick=${() => onApply(formData)}>Apply</button>
          <button onClick=${onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  `;
};
```

### Enhanced Node Rendering (JBeam Compatible)
Based on JBeam NodeRenderer patterns:

```javascript
const renderNode = (node, screen, viewport) => {
  const elements = [];
  const nodeRadius = 6;
  const constraintSymbolSize = 12;
  
  // Base node circle
  elements.push(html`
    <circle
      cx=${screen.x}
      cy=${screen.z}
      r=${nodeRadius}
      fill="none"
      stroke="var(--accent-color)"
      stroke-width="2"
      class="node"
    />
  `);
  
  // Constraint symbols (based on JBeam NodeRenderer)
  if (node.constraints.x && node.constraints.z && node.constraints.r) {
    // Fixed constraint (cross symbol)
    elements.push(html`
      <g transform="translate(${screen.x}, ${screen.z})">
        <line x1="-${constraintSymbolSize/2}" y1="0" x2="${constraintSymbolSize/2}" y2="0" 
              stroke="var(--constraint-color)" stroke-width="2" />
        <line x1="0" y1="-${constraintSymbolSize/2}" x2="0" y2="${constraintSymbolSize/2}" 
              stroke="var(--constraint-color)" stroke-width="2" />
        <circle cx="0" cy="0" r="${constraintSymbolSize/3}" 
                fill="none" stroke="var(--constraint-color)" stroke-width="2" />
      </g>
    `);
  } else if (node.constraints.x && node.constraints.z) {
    // Pinned constraint (triangle base)
    elements.push(html`
      <polygon points="${screen.x},${screen.z + nodeRadius + 2} ${screen.x - constraintSymbolSize/2},${screen.z + nodeRadius + constraintSymbolSize} ${screen.x + constraintSymbolSize/2},${screen.z + nodeRadius + constraintSymbolSize}"
               fill="var(--constraint-color)" stroke="var(--constraint-color)" />
    `);
  } else if (node.constraints.x || node.constraints.z) {
    // Roller constraint (line with circles)
    const angle = node.constraints.x ? 90 : 0;
    elements.push(html`
      <g transform="translate(${screen.x}, ${screen.z}) rotate(${angle})">
        <line x1="0" y1="${nodeRadius + 2}" x2="0" y2="${nodeRadius + constraintSymbolSize}" 
              stroke="var(--constraint-color)" stroke-width="2" />
        <circle cx="-3" cy="${nodeRadius + constraintSymbolSize + 3}" r="3" 
                fill="var(--constraint-color)" />
        <circle cx="3" cy="${nodeRadius + constraintSymbolSize + 3}" r="3" 
                fill="var(--constraint-color)" />
      </g>
    `);
  }
  
  // Force vectors
  if (Math.abs(node.loads.fx) > 0.001 || Math.abs(node.loads.fz) > 0.001) {
    const forceScale = 50; // Scale factor for force display
    const fx = node.loads.fx * forceScale;
    const fz = node.loads.fz * forceScale;
    const forceLength = Math.sqrt(fx * fx + fz * fz);
    
    if (forceLength > 1) {
      const arrowLength = Math.min(forceLength, 40);
      const endX = screen.x + (fx / forceLength) * arrowLength;
      const endZ = screen.z + (fz / forceLength) * arrowLength;
      
      elements.push(html`
        <g class="force-vector">
          <line x1=${screen.x} y1=${screen.z} x2=${endX} y2=${endZ} 
                stroke="var(--force-color)" stroke-width="2" marker-end="url(#arrowhead)" />
          <text x=${endX + 5} y=${endZ - 5} class="force-label" fill="var(--force-color)">
            ${Math.round(Math.sqrt(node.loads.fx * node.loads.fx + node.loads.fz * node.loads.fz) * 100) / 100}
          </text>
        </g>
      `);
    }
  }
  
  // Moment symbol
  if (Math.abs(node.loads.m) > 0.001) {
    const momentRadius = 15;
    const clockwise = node.loads.m < 0;
    
    elements.push(html`
      <g class="moment-symbol">
        <circle cx=${screen.x} cy=${screen.z} r=${momentRadius} 
                fill="none" stroke="var(--moment-color)" stroke-width="2" 
                stroke-dasharray="3,2" />
        <text x=${screen.x + momentRadius + 5} y=${screen.z - 5} class="moment-label" fill="var(--moment-color)">
          ${Math.abs(node.loads.m)}
        </text>
        ${clockwise ? html`
          <polygon points="${screen.x + momentRadius - 3},${screen.z - 3} ${screen.x + momentRadius + 3},${screen.z} ${screen.x + momentRadius - 3},${screen.z + 3}"
                   fill="var(--moment-color)" />
        ` : html`
          <polygon points="${screen.x + momentRadius - 3},${screen.z + 3} ${screen.x + momentRadius + 3},${screen.z} ${screen.x + momentRadius - 3},${screen.z - 3}"
                   fill="var(--moment-color)" />
        `}
      </g>
    `);
  }
  
  // Node label
  if (node.label) {
    elements.push(html`
      <text x=${screen.x + nodeRadius + 5} y=${screen.z - nodeRadius - 5} 
            class="node-label" fill="var(--text-primary)">
        ${node.label}
      </text>
    `);
  }
  
  return elements;
};
```

### CSS Styling
```css
/* Node properties editor */
.node-properties-editor {
  width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.form-section {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.form-section h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: var(--text-primary);
}

.form-section label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.form-section input[type="text"],
.form-section input[type="number"] {
  width: 100%;
  padding: 6px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.form-section input[type="checkbox"] {
  margin-right: 8px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.form-actions button {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
}

.form-actions button:hover {
  background: var(--accent-color);
  color: white;
}

/* Node visual elements */
.node-label {
  font-size: 12px;
  font-family: monospace;
  user-select: none;
}

.force-label,
.moment-label {
  font-size: 10px;
  font-family: monospace;
  user-select: none;
}

/* Color scheme extensions */
:root {
  --constraint-color: #ff6b35;
  --force-color: #2196f3;
  --moment-color: #4caf50;
}

.dark-theme {
  --constraint-color: #ff8a65;
  --force-color: #64b5f6;
  --moment-color: #81c784;
}
```

### Right-click Event Handling
```javascript
const handleContextMenu = (event, node) => {
  event.preventDefault();
  
  // Switch to select mode
  if (applicationMode !== MODES.SELECT) {
    setApplicationMode(MODES.SELECT);
  }
  
  // Open property editor for this node
  setSelectedNode(node);
  setShowNodeEditor(true);
};

// In ContentArea component
${model.nodes.map(node => {
  const screen = worldToScreen(node.coordinates.x, node.coordinates.z, viewport, dimensions);
  return html`
    <g onContextMenu=${(e) => handleContextMenu(e, node)} class="node-group">
      ${renderNode(node, screen, viewport)}
    </g>
  `;
})}
```

### Model Update Logic
```javascript
const updateNodeProperties = (nodeId, newProperties) => {
  setModel(prevModel => ({
    ...prevModel,
    nodes: prevModel.nodes.map(node => 
      node.id === nodeId 
        ? { ...node, ...newProperties }
        : node
    )
  }));
};

const handleNodePropertiesApply = (formData) => {
  if (selectedNode) {
    updateNodeProperties(selectedNode.id, formData);
    setShowNodeEditor(false);
    setSelectedNode(null);
  }
};
```

## UI Changes

### SVG Enhancements
- Add SVG marker definitions for force arrows
- Implement layered rendering (constraints, forces, moments, labels)
- Add selection highlighting for active node editing

### CSS Custom Properties
- Add colors for constraints, forces, moments
- Ensure proper contrast in both light and dark themes
- Add hover effects for interactive elements

### Modal System
- Extend existing modal system for property editor
- Add form validation and error handling
- Implement keyboard navigation (Tab, Enter, Escape)

## JBeam Compatibility Requirements

### Visual Representation
- **Constraint Symbols**: Match JBeam's geometric representations
- **Force Vectors**: Arrow-headed lines with magnitude labels
- **Moment Symbols**: Circular arcs with directional indicators
- **Node Labels**: Text positioning and formatting

### Data Model Consistency
- **Property Structure**: Maintain exact JBeam JSON schema
- **Coordinate System**: Preserve x-z coordinate conventions
- **Unit Handling**: Consistent with JBeam's dimensionless approach
- **Validation**: Ensure all properties meet JBeam requirements

## Performance Considerations

### Rendering Optimization
- Use SVG groups for complex node symbols
- Implement viewport culling for large models
- Cache rendered node symbols for repeated elements

### Form Handling
- Debounce input validation
- Prevent excessive re-renders during editing
- Validate numerical inputs for structural analysis

## Accessibility Features

### Keyboard Navigation
- Tab through form fields
- Enter to apply, Escape to cancel
- Arrow keys for numerical input adjustment

### Screen Reader Support
- Proper ARIA labels for form controls
- Descriptive text for constraint types
- Clear feedback for applied changes

## Edge Cases and Validation

### Input Validation
- Numerical bounds for coordinates and loads
- Required field validation (label, position)
- Constraint combination validation
- Load magnitude reasonable limits

### Error Handling
- Invalid coordinate transformations
- Conflicting constraint combinations
- Network/storage errors during model updates
- Recovery from corrupted property data

## Testing Strategy

### Interaction Testing
- Right-click behavior in all modes
- Form validation with various inputs
- Apply/Cancel workflow verification
- Mode switching during property editing

### Visual Rendering Testing
- Constraint symbol accuracy across zoom levels
- Force vector scaling and positioning
- Moment symbol orientation and sizing
- Label positioning and readability

### JBeam Compatibility Testing
- Property structure validation
- Visual representation comparison
- Cross-platform model verification
- Import/export of edited models

## Implementation Tasks

1. **Core Property Editor**
   - Add NodePropertiesEditor component
   - Implement form state management
   - Add right-click event handling
   - Wire up Apply/Cancel functionality

2. **Enhanced Node Rendering**
   - Implement JBeam-compatible constraint symbols
   - Add force vector rendering with arrows
   - Add moment symbol rendering
   - Add node label positioning

3. **CSS and Styling**
   - Add property editor modal styles
   - Define colors for constraints, forces, moments
   - Add form control styling
   - Implement responsive design

4. **Model Integration**
   - Add selected node state management
   - Implement property update logic
   - Add validation for property changes
   - Ensure model persistence

5. **SVG Enhancements**
   - Add marker definitions for arrows
   - Implement layered rendering system
   - Add selection highlighting
   - Optimize performance for complex nodes

6. **Testing and Polish**
   - Test across different browsers
   - Verify JBeam visual compatibility
   - Add keyboard accessibility
   - Performance optimization

## Future Enhancements

### Advanced Property Editing
- Bulk property editing for multiple nodes
- Property templates and presets
- Copy/paste properties between nodes
- Property inheritance from node types

### Visual Enhancements
- Animation for property changes
- Highlight affected elements during editing
- Property preview before applying
- Custom node symbols based on function

### Analysis Integration
- Property validation for structural analysis
- Warning indicators for invalid combinations
- Load path visualization
- Constraint reaction display

## Consequences

### Positive
- **Complete Node Functionality**: Full property control for structural modeling
- **JBeam Visual Compatibility**: Consistent appearance with desktop JBeam
- **Improved User Experience**: Intuitive right-click editing workflow
- **Professional Interface**: Engineering-standard symbols and representations
- **Structural Analysis Ready**: All properties needed for FEA calculations

### Negative
- **Increased Complexity**: More complex rendering and event handling
- **Performance Impact**: Additional SVG elements and calculations
- **Testing Burden**: Many visual states and property combinations
- **Learning Curve**: Users need to understand structural analysis concepts

### Technical Trade-offs
- **Rendering vs Performance**: Detailed graphics require more CPU/GPU resources
- **Flexibility vs Simplicity**: Comprehensive property editing adds interface complexity
- **Compatibility vs Innovation**: JBeam compatibility limits visual design freedom

## Alternatives Considered

1. **Separate Property Panel**
   - Rejected: Takes up permanent screen space, less intuitive than modal

2. **In-place Property Editing**
   - Rejected: Clutters the drawing area, difficult with coordinate transformations

3. **Simplified Property Editor**
   - Rejected: Doesn't support full JBeam compatibility requirements

4. **Custom Canvas Rendering**
   - Rejected: Breaks accessibility, harder to maintain than SVG

## Risk Mitigation

### Performance Risks
- Implement viewport culling for large models
- Use efficient SVG rendering techniques
- Profile and optimize complex node rendering

### Compatibility Risks
- Validate against JBeam test models
- Implement comprehensive property validation
- Test cross-platform model exchange

### User Experience Risks
- Provide clear visual feedback during editing
- Add undo/redo for property changes
- Implement robust error handling and recovery