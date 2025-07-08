import { html } from 'htm/preact';
import { worldToScreen, calculateGridSpacing, screenToWorld } from './util.js';
import { eps } from './math.js';

// SVG marker definitions for arrows
export const svgMarkers = html`
    <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
            <polygon points="0 0, 6 2.5, 0 5" fill="none" stroke="var(--force-color)" stroke-width="1" />
        </marker>
    </defs>
`;

// Grid rendering with adaptive spacing
export const renderGrid = (viewport, dimensions) => {
    const baseGridSize = 20;
    const gridSpacing = calculateGridSpacing(baseGridSize, viewport.zoom);
    const points = [];
    
    // Calculate visible world area
    const visibleWorldArea = {
        minX: screenToWorld(0, 0, viewport, dimensions).x,
        maxX: screenToWorld(dimensions.width, 0, viewport, dimensions).x,
        minZ: screenToWorld(0, 0, viewport, dimensions).z,
        maxZ: screenToWorld(0, dimensions.height, viewport, dimensions).z
    };

    // Generate grid points only in visible area
    for (let x = Math.floor(visibleWorldArea.minX / gridSpacing) * gridSpacing; 
         x <= visibleWorldArea.maxX; 
         x += gridSpacing) {
        for (let z = Math.floor(visibleWorldArea.minZ / gridSpacing) * gridSpacing; 
             z <= visibleWorldArea.maxZ; 
             z += gridSpacing) {
            points.push([x, z]);
        }
    }

    return points.map(([worldX, worldZ]) => {
        const screen = worldToScreen(worldX, worldZ, viewport, dimensions);
        return html`<circle cx=${screen.x} cy=${screen.z} r="0.5" fill="var(--grid-color)" vector-effect="non-scaling-stroke" />`;
    });
};

// Enhanced node rendering with JBeam-compatible symbols
export const renderNode = (node, screen, viewport) => {
    const elements = [];
    const nodeRadius = 6;
    const constraintSymbolSize = 12;
    
    // Invisible larger circle for easier clicking (tolerance area)
    elements.push(html`
        <circle
            cx=${screen.x}
            cy=${screen.z}
            r="15"
            fill="transparent"
            stroke="none"
            class="node-clickarea"
        />
    `);
    
    // Base node shape - square for R constrained, circle for others
    if (node.constraints.r) {
        // Square for rotationally constrained nodes
        elements.push(html`
            <rect
                x=${screen.x - nodeRadius}
                y=${screen.z - nodeRadius}
                width=${nodeRadius * 2}
                height=${nodeRadius * 2}
                fill="none"
                stroke="var(--accent-color)"
                stroke-width="2"
                class="node"
            />
        `);
    } else {
        // Circle for unconstrained nodes
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
    }

    // hatchlines for XZ constrained bases
    const hatchlines = [];
    for (let x = -0.5*constraintSymbolSize; x <= +0.5*constraintSymbolSize; x += constraintSymbolSize/6) {
        hatchlines.push(html`
                <line x1="${screen.x - x}" y1="${screen.z + nodeRadius + 18/12*constraintSymbolSize}" x2="${screen.x - x - 0.5*constraintSymbolSize}" y2="${screen.z + nodeRadius + 2*constraintSymbolSize}" stroke-width="1" />
        `);
    }
    
    // Constraint symbols (based on JBeam NodeRenderer reference)
    if (node.constraints.x && node.constraints.z && node.constraints.r) {
        // Full constraint - upside-down T with cross-hatched base
        elements.push(html`
            <g class="constraint-symbol">
                <!-- Vertical post of the T -->
                <line x1="${screen.x}" y1="${screen.z + nodeRadius + constraintSymbolSize/6}" x2="${screen.x}" y2="${screen.z + nodeRadius + 16/12*constraintSymbolSize}" stroke-width="2" />
                <!-- Horizontal base of the T -->
                <line x1="${screen.x - 10/12*constraintSymbolSize}" y1="${screen.z + nodeRadius + 16/12*constraintSymbolSize}" x2="${screen.x + 10/12*constraintSymbolSize}" y2="${screen.z + nodeRadius + 16/12*constraintSymbolSize}" stroke-width="2" />
                <!-- hatched fill -->
                ${hatchlines}
            </g>
        `);
    } else if (node.constraints.x && node.constraints.z) {
        // XZ constrained (pinned) - triangle outline with cross-hatched base
        elements.push(html`
            <g class="constraint-symbol">
                <!-- Triangle outline (no fill) -->
                <polygon fill="none" stroke-width="2"
                         points="${screen.x},${screen.z + nodeRadius + 2/12*constraintSymbolSize} ${screen.x - 8/12*constraintSymbolSize},${screen.z + nodeRadius + 14/12*constraintSymbolSize} ${screen.x + 8/12*constraintSymbolSize},${screen.z + nodeRadius + 14/12*constraintSymbolSize}" />
                <!-- hatched fill -->
                ${hatchlines}
            </g>
        `);
    } else if (node.constraints.x && !node.constraints.z) {
        // X constrained only (horizontal roller) - triangle with slider line
        elements.push(html`
            <g class="constraint-symbol">
                <!-- Triangle outline (no fill) -->
                <polygon fill="none" stroke-width="2"
                         points="${screen.x},${screen.z + nodeRadius + 2/12*constraintSymbolSize} ${screen.x - 8/12*constraintSymbolSize},${screen.z + nodeRadius + 14/12*constraintSymbolSize} ${screen.x + 8/12*constraintSymbolSize},${screen.z + nodeRadius + 14/12*constraintSymbolSize}" />
                <!-- Slider line parallel to triangle base -->
                <line x1="${screen.x - 8/12*constraintSymbolSize}" y1="${screen.z + nodeRadius + 18/12*constraintSymbolSize}" x2="${screen.x + 8/12*constraintSymbolSize}" y2="${screen.z + nodeRadius + 18/12*constraintSymbolSize}" stroke-width="2" />
            </g>
        `);
    } else if (!node.constraints.x && node.constraints.z) {
        // Z constrained only (vertical roller) - triangle rotated 90° CCW with slider line
        elements.push(html`
            <g class="constraint-symbol">
                <!-- Triangle pointing right (rotated 90° CCW) -->
                <polygon fill="none" stroke-width="2"
                         points="${screen.x + nodeRadius + 2/12*constraintSymbolSize},${screen.z} ${screen.x + nodeRadius + 14/12*constraintSymbolSize},${screen.z - 8/12*constraintSymbolSize} ${screen.x + nodeRadius + 14/12*constraintSymbolSize},${screen.z + 8/12*constraintSymbolSize}" />
                <!-- Slider line parallel to triangle base (vertical) -->
                <line x1="${screen.x + nodeRadius + 18/12*constraintSymbolSize}" y1="${screen.z - 8/12*constraintSymbolSize}" x2="${screen.x + nodeRadius + 18/12*constraintSymbolSize}" y2="${screen.z + 8/12*constraintSymbolSize}" stroke-width="2" />
            </g>
        `);
    }
    
    // Force vectors
    if (Math.abs(node.loads.fx) > eps || Math.abs(node.loads.fz) > eps) {
        const forceScale = 40; // Scale factor for force display (200% of 20)
        const fx = node.loads.fx * forceScale;
        const fz = node.loads.fz * forceScale;
        const forceLength = Math.sqrt(fx * fx + fz * fz);
        
        if (forceLength > 1) {
            const arrowLength = Math.min(forceLength, 30); // 200% of 15
            const startX = screen.x - (fx / forceLength) * arrowLength;
            const startZ = screen.z - (fz / forceLength) * arrowLength;
            
            elements.push(html`
                <g class="force-vector">
                    <line x1=${startX} y1=${startZ} x2=${screen.x} y2=${screen.z} stroke="var(--force-color)" stroke-width="2" marker-end="url(#arrowhead)" />
                    <text x=${screen.x + 8} y=${screen.z - 8} class="force-label">
                        ${Math.round(Math.sqrt(node.loads.fx * node.loads.fx + node.loads.fz * node.loads.fz) * 100) / 100}
                    </text>
                </g>
            `);
        }
    }
    
    // Moment symbol
    if (Math.abs(node.loads.m) > eps) {
        const momentRadius = 12;
        const clockwise = node.loads.m < 0;
        
        elements.push(html`
            <g class="moment-symbol">
                <!-- Half circle arc above node, centered on node -->
                <path d="M ${screen.x - momentRadius} ${screen.z} A ${momentRadius} ${momentRadius} 0 0 ${clockwise ? 1 : 0} ${screen.x + momentRadius} ${screen.z}" 
                      fill="none" stroke-width="2" />
                <text x=${screen.x + momentRadius + 5} y=${screen.z - 5} class="moment-label">
                    ${Math.abs(node.loads.m)}
                </text>
                <!-- Arrow at end of arc (CCW for positive moment) -->
                <polygon points="${screen.x + momentRadius - 0},${clockwise ? screen.z + 4 : screen.z - 4} ${screen.x + momentRadius + 4},${clockwise ? screen.z - 4 : screen.z + 4} ${screen.x + momentRadius - 4},${clockwise ? screen.z - 4 : screen.z + 4}" 
                         fill="none" stroke="var(--force-color)" stroke-width="1" />
            </g>
        `);
    }
    
    // Node label
    if (node.label && node.label.trim() !== '') {
        elements.push(html`
            <text x=${screen.x + nodeRadius + 5} y=${screen.z - nodeRadius - 5} class="node-label" fill="var(--text-primary)">
                ${node.label}
            </text>
        `);
    }
    
    return elements;
};

// Render all nodes with their symbols
export const renderNodes = (nodes, viewport, dimensions) => {
    return nodes.map(node => {
        const screen = worldToScreen(node.coordinates.x, node.coordinates.z, viewport, dimensions);
        return html`
            <g class="node-group" data-node-id=${node.id}>
                ${renderNode(node, screen, viewport)}
            </g>
        `;
    });
};

// Beam rendering (future implementation)
export const renderBeam = (beam, startNode, endNode, viewport, dimensions) => {
    const startScreen = worldToScreen(startNode.coordinates.x, startNode.coordinates.z, viewport, dimensions);
    const endScreen = worldToScreen(endNode.coordinates.x, endNode.coordinates.z, viewport, dimensions);
    
    return html`
        <g class="beam-group" data-beam-id=${beam.id}>
            <line 
                x1=${startScreen.x} 
                y1=${startScreen.z} 
                x2=${endScreen.x} 
                y2=${endScreen.z}
                stroke="var(--accent-color)"
                stroke-width="3"
                class="beam"
            />
            ${beam.label && html`
                <text 
                    x=${(startScreen.x + endScreen.x) / 2} 
                    y=${(startScreen.z + endScreen.z) / 2 - 10}
                    class="beam-label" 
                    fill="var(--text-primary)"
                    text-anchor="middle"
                >
                    ${beam.label}
                </text>
            `}
        </g>
    `;
};

// Render truss element (JBeam TrussBeam)
export const renderTruss = (truss, startNode, endNode, viewport, dimensions) => {
    const startScreen = worldToScreen(startNode.coordinates.x, startNode.coordinates.z, viewport, dimensions);
    const endScreen = worldToScreen(endNode.coordinates.x, endNode.coordinates.z, viewport, dimensions);
    
    return html`
        <g class="truss-group" data-truss-id=${truss.id}>
            <line 
                x1=${startScreen.x} 
                y1=${startScreen.z} 
                x2=${endScreen.x} 
                y2=${endScreen.z}
                stroke="var(--truss-color)"
                stroke-width="3"
                class="truss"
            />
            ${truss.label && html`
                <text 
                    x=${(startScreen.x + endScreen.x) / 2} 
                    y=${(startScreen.z + endScreen.z) / 2 - 10}
                    class="truss-label" 
                    fill="var(--text-primary)"
                    text-anchor="middle"
                >
                    ${truss.label}
                </text>
            `}
        </g>
    `;
};

// Render truss preview (rubber band) during truss entry
export const renderTrussPreview = (startNode, mousePosition, viewport, dimensions) => {
    if (!startNode || !mousePosition) return null;
    
    const startScreen = worldToScreen(startNode.coordinates.x, startNode.coordinates.z, viewport, dimensions);
    const endScreen = mousePosition; // mousePosition is already in screen coordinates
    
    return html`
        <g class="truss-preview-group">
            <line 
                x1=${startScreen.x} 
                y1=${startScreen.z} 
                x2=${endScreen.x} 
                y2=${endScreen.z}
                stroke="var(--truss-preview-color)"
                stroke-width="2"
                stroke-dasharray="5,5"
                class="truss-preview"
            />
        </g>
    `;
};

// Render all beams and trusses
export const renderBeams = (beams, nodes, viewport, dimensions) => {
    return beams.map(beam => {
        if (beam.type === 'truss') {
            // Handle JBeam truss structure with nodeIds array
            const [startNodeId, endNodeId] = beam.nodeIds;
            const startNode = nodes.find(node => node.id === startNodeId);
            const endNode = nodes.find(node => node.id === endNodeId);
            
            if (!startNode || !endNode) {
                console.warn(`Truss ${beam.id} references non-existent nodes`);
                return null;
            }
            
            return renderTruss(beam, startNode, endNode, viewport, dimensions);
        } else {
            // Handle legacy beam structure with startNode/endNode properties
            const startNode = nodes.find(node => node.id === beam.startNode);
            const endNode = nodes.find(node => node.id === beam.endNode);
            
            if (!startNode || !endNode) {
                console.warn(`Beam ${beam.id} references non-existent nodes`);
                return null;
            }
            
            return renderBeam(beam, startNode, endNode, viewport, dimensions);
        }
    }).filter(Boolean);
};

// Results visualization (future implementation)
export const renderResults = (results, model, viewport, dimensions) => {
    if (!results) return [];
    
    const elements = [];
    
    // Render displaced shape
    if (results.displacements) {
        // Implementation for displaced node positions
    }
    
    // Render force diagrams
    if (results.forces) {
        // Implementation for beam force diagrams
    }
    
    // Render moment diagrams
    if (results.moments) {
        // Implementation for beam moment diagrams
    }
    
    return elements;
};

// Selection highlighting
export const renderSelection = (selectedItems, viewport, dimensions) => {
    const elements = [];
    
    selectedItems.forEach(item => {
        if (item.type === 'node') {
            const screen = worldToScreen(item.coordinates.x, item.coordinates.z, viewport, dimensions);
            elements.push(html`
                <circle
                    cx=${screen.x}
                    cy=${screen.z}
                    r="12"
                    fill="none"
                    stroke="var(--accent-color)"
                    stroke-width="3"
                    stroke-dasharray="5,5"
                    class="selection-highlight"
                />
            `);
        } else if (item.type === 'beam') {
            // Implementation for beam selection highlighting
        }
    });
    
    return elements;
};

// Viewport bounds indicator (future)
export const renderViewportBounds = (viewport, dimensions) => {
    // Implementation for viewport bounds visualization
    return [];
};

// Coordinate system indicators (future)
export const renderCoordinateSystem = (viewport, dimensions) => {
    // Implementation for coordinate system axes
    return [];
};
