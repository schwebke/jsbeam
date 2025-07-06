import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';

// MenuBar component
export function MenuBar({ onAbout, onToggleTheme, currentTheme, applicationMode, onModeChange, onFileNew, viewport, onZoomIn, onZoomOut, onZoomFit, onZoomActual }) {
    const [showFileMenu, setShowFileMenu] = useState(false);
    const [showHelpMenu, setShowHelpMenu] = useState(false);
    const [showModeMenu, setShowModeMenu] = useState(false);
    const [showViewMenu, setShowViewMenu] = useState(false);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.menu-item')) {
                setShowFileMenu(false);
                setShowHelpMenu(false);
                setShowModeMenu(false);
                setShowViewMenu(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleFileMenuClick = (e) => {
        e.stopPropagation();
        setShowHelpMenu(false);
        setShowModeMenu(false);
        setShowViewMenu(false);
        setShowFileMenu(!showFileMenu);
    };

    const handleModeMenuClick = (e) => {
        e.stopPropagation();
        setShowFileMenu(false);
        setShowHelpMenu(false);
        setShowViewMenu(false);
        setShowModeMenu(!showModeMenu);
    };

    const handleViewMenuClick = (e) => {
        e.stopPropagation();
        setShowFileMenu(false);
        setShowHelpMenu(false);
        setShowModeMenu(false);
        setShowViewMenu(!showViewMenu);
    };

    const handleHelpMenuClick = (e) => {
        e.stopPropagation();
        setShowFileMenu(false);
        setShowModeMenu(false);
        setShowViewMenu(false);
        setShowHelpMenu(!showHelpMenu);
    };

    const handleFileNew = (e) => {
        e.stopPropagation();
        setShowFileMenu(false);
        onFileNew();
    };

    const handleToggleTheme = (e) => {
        e.stopPropagation();
        setShowHelpMenu(false);
        onToggleTheme();
    };

    const handleAbout = (e) => {
        e.stopPropagation();
        setShowHelpMenu(false);
        onAbout();
    };

    const handleModeSelect = (mode) => (e) => {
        e.stopPropagation();
        setShowModeMenu(false);
        onModeChange(mode);
    };

    const handleZoomIn = (e) => {
        e.stopPropagation();
        setShowViewMenu(false);
        onZoomIn();
    };

    const handleZoomOut = (e) => {
        e.stopPropagation();
        setShowViewMenu(false);
        onZoomOut();
    };

    const handleZoomFit = (e) => {
        e.stopPropagation();
        setShowViewMenu(false);
        onZoomFit();
    };

    const handleZoomActual = (e) => {
        e.stopPropagation();
        setShowViewMenu(false);
        onZoomActual();
    };

    return html`
        <div class="menubar">
            <div class="menu-item" onClick=${handleFileMenuClick}>
                File
                ${showFileMenu && html`
                    <div class="dropdown">
                        <div class="dropdown-item" onClick=${handleFileNew}>New</div>
                    </div>
                `}
            </div>
            <div class="menu-item" onClick=${handleModeMenuClick}>
                Mode
                ${showModeMenu && html`
                    <div class="dropdown">
                        <div class="dropdown-item" onClick=${handleModeSelect('select')}>
                            ${applicationMode === 'select' ? '✓ ' : ''}Select
                        </div>
                        <div class="dropdown-item" onClick=${handleModeSelect('addNode')}>
                            ${applicationMode === 'addNode' ? '✓ ' : ''}Add Node
                        </div>
                    </div>
                `}
            </div>
            <div class="menu-item" onClick=${handleViewMenuClick}>
                View
                ${showViewMenu && html`
                    <div class="dropdown">
                        <div class="dropdown-item" onClick=${handleZoomIn}>Zoom In</div>
                        <div class="dropdown-item" onClick=${handleZoomOut}>Zoom Out</div>
                        <div class="dropdown-item" onClick=${handleZoomFit}>Zoom to Fit</div>
                        <div class="dropdown-item" onClick=${handleZoomActual}>Actual Size</div>
                    </div>
                `}
            </div>
            <div class="menu-item" onClick=${handleHelpMenuClick}>
                ?
                ${showHelpMenu && html`
                    <div class="dropdown">
                        <div class="dropdown-item" onClick=${handleToggleTheme}>
                            ${currentTheme === 'light' ? 'Dark Mode' : 'Light Mode'}
                        </div>
                        <div class="dropdown-item" onClick=${handleAbout}>About</div>
                    </div>
                `}
            </div>
        </div>
    `;
}

// StatusBar component
export function StatusBar({ applicationMode, cursorCoordinates, model, viewport }) {
    const modeDisplay = applicationMode === 'select' ? 'Select' : 'Add Node';
    const zoomPercent = Math.round(viewport.zoom * 100);
    
    return html`
        <div class="statusbar">
            Mode: ${modeDisplay} | X: ${Math.round(cursorCoordinates.x)}, Z: ${Math.round(cursorCoordinates.z)} | Zoom: ${zoomPercent}% | Nodes: ${model.nodes.length}, Beams: ${model.beams.length}
        </div>
    `;
}

// ContentArea component with SVG point grid
export function ContentArea({ applicationMode, model, onAddNode, onCursorMove, viewport, onViewportChange, onNodeContextMenu }) {
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState(null);
    const baseGridSize = 20;
    
    // Update dimensions when container size changes
    useEffect(() => {
        const updateDimensions = () => {
            const contentArea = document.querySelector('.content-area');
            if (contentArea) {
                setDimensions({
                    width: contentArea.clientWidth,
                    height: contentArea.clientHeight
                });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Generate grid points with adaptive spacing
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

    // Handle mouse events
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
        const rect = event.currentTarget.getBoundingClientRect();
        
        if (isPanning && panStart) {
            const deltaX = (event.clientX - panStart.x) / viewport.zoom;
            const deltaZ = (event.clientY - panStart.z) / viewport.zoom;
            
            onViewportChange({
                ...viewport,
                pan: {
                    x: panStart.viewport.pan.x - deltaX,
                    z: panStart.viewport.pan.z - deltaZ
                }
            });
        }
        
        // Update cursor coordinates in world space
        const screenX = event.clientX - rect.left;
        const screenZ = event.clientY - rect.top;
        const worldCoords = screenToWorld(screenX, screenZ, viewport, dimensions);
        onCursorMove(worldCoords);
    };

    const handleMouseUp = (event) => {
        if (event.button === 1) { // Middle mouse button
            setIsPanning(false);
            setPanStart(null);
        }
    };

    const handleClick = (event) => {
        if (applicationMode === 'addNode' && !isPanning) {
            const rect = event.currentTarget.getBoundingClientRect();
            const screenX = event.clientX - rect.left;
            const screenZ = event.clientY - rect.top;
            const worldCoords = screenToWorld(screenX, screenZ, viewport, dimensions);
            onAddNode(worldCoords);
        }
    };

    const handleWheel = (event) => {
        if (event.ctrlKey) {
            event.preventDefault();
            
            // Get mouse position in world coordinates before zoom
            const rect = event.currentTarget.getBoundingClientRect();
            const mouseScreen = {
                x: event.clientX - rect.left,
                z: event.clientY - rect.top
            };
            const mouseWorldBefore = screenToWorld(mouseScreen.x, mouseScreen.z, viewport, dimensions);
            
            // Calculate new zoom level
            const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.max(
                viewport.minZoom,
                Math.min(viewport.maxZoom, viewport.zoom * zoomFactor)
            );
            
            // Calculate new pan to keep mouse position fixed
            const mouseWorldAfter = screenToWorld(mouseScreen.x, mouseScreen.z, { ...viewport, zoom: newZoom }, dimensions);
            const panAdjustment = {
                x: mouseWorldBefore.x - mouseWorldAfter.x,
                z: mouseWorldBefore.z - mouseWorldAfter.z
            };
            
            onViewportChange({
                ...viewport,
                zoom: newZoom,
                pan: {
                    x: viewport.pan.x + panAdjustment.x,
                    z: viewport.pan.z + panAdjustment.z
                }
            });
        }
    };

    return html`
        <div class="content-area ${applicationMode === 'addNode' ? 'mode-addNode' : ''} ${isPanning ? 'panning' : ''}" 
             onMouseDown=${handleMouseDown} 
             onMouseMove=${handleMouseMove} 
             onMouseUp=${handleMouseUp}
             onClick=${handleClick}
             onWheel=${handleWheel}>
            <svg width="100%" height="100%" viewBox="0 0 ${dimensions.width} ${dimensions.height}">
                <defs>
                    <marker id="arrowhead" markerWidth="3" markerHeight="2.5" refX="3" refY="1.25" orient="auto">
                        <polygon points="0 0, 3 1.25, 0 2.5" fill="none" stroke="var(--moment-color)" stroke-width="1" />
                    </marker>
                </defs>
                ${points.map(([worldX, worldZ]) => {
                    const screen = worldToScreen(worldX, worldZ, viewport, dimensions);
                    return html`<circle cx=${screen.x} cy=${screen.z} r="0.5" fill="var(--grid-color)" vector-effect="non-scaling-stroke" />`;
                })}
                ${model.nodes.map(node => {
                    const screen = worldToScreen(node.coordinates.x, node.coordinates.z, viewport, dimensions);
                    return html`
                        <g class="node-group" onContextMenu=${(e) => onNodeContextMenu && onNodeContextMenu(e, node)}>
                            ${renderNode(node, screen, viewport)}
                        </g>
                    `;
                })}
            </svg>
        </div>
    `;
}

// About dialog component
export function AboutDialog({ isOpen, onClose }) {
    if (!isOpen) return null;

    return html`
        <div class="modal-overlay" onClick=${onClose}>
            <div class="modal-content" onClick=${(e) => e.stopPropagation()}>
                <h2>About JSBeam</h2>
                <p>JSBeam - Plane Frame and Truss Calculation Web Application</p>
                <p>Copyright (C) 2025 Kai Gerd Schwebke</p>
                <p>Licensed under GPL v3</p>
                <button onClick=${onClose}>Close</button>
            </div>
        </div>
    `;
}

// Node Properties Editor component
export function NodePropertiesEditor({ node, isOpen, onApply, onCancel }) {
    if (!isOpen || !node) return null;

    const [formData, setFormData] = useState({
        label: node.label || '',
        coordinates: { x: node.coordinates.x, z: node.coordinates.z },
        constraints: { x: node.constraints.x, z: node.constraints.z, r: node.constraints.r },
        loads: { fx: node.loads.fx, fz: node.loads.fz, m: node.loads.m }
    });

    // Reset form data when node changes
    useEffect(() => {
        if (node) {
            setFormData({
                label: node.label || '',
                coordinates: { x: node.coordinates.x, z: node.coordinates.z },
                constraints: { x: node.constraints.x, z: node.constraints.z, r: node.constraints.r },
                loads: { fx: node.loads.fx, fz: node.loads.fz, m: node.loads.m }
            });
        }
    }, [node]);

    const handleApply = () => {
        onApply(formData);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleApply();
        } else if (event.key === 'Escape') {
            onCancel();
        }
    };

    return html`
        <div class="modal-overlay" onClick=${onCancel}>
            <div class="modal-content node-properties-editor" onClick=${(e) => e.stopPropagation()} onKeyDown=${handleKeyDown}>
                <h3>Node Properties: ${node.id}</h3>
                
                <div class="form-section">
                    <label>Label:</label>
                    <input type="text" value=${formData.label} 
                           onChange=${(e) => setFormData({...formData, label: e.target.value})} />
                </div>
                
                <div class="form-section">
                    <h4>Position</h4>
                    <label>X: 
                        <input type="number" value=${formData.coordinates.x} step="0.1"
                               onChange=${(e) => setFormData({...formData, coordinates: {...formData.coordinates, x: parseFloat(e.target.value) || 0}})} />
                    </label>
                    <label>Z: 
                        <input type="number" value=${formData.coordinates.z} step="0.1"
                               onChange=${(e) => setFormData({...formData, coordinates: {...formData.coordinates, z: parseFloat(e.target.value) || 0}})} />
                    </label>
                </div>
                
                <div class="form-section">
                    <h4>Constraints</h4>
                    <label>
                        <input type="checkbox" checked=${formData.constraints.x} 
                               onChange=${(e) => setFormData({...formData, constraints: {...formData.constraints, x: e.target.checked}})} />
                        X (Horizontal)
                    </label>
                    <label>
                        <input type="checkbox" checked=${formData.constraints.z} 
                               onChange=${(e) => setFormData({...formData, constraints: {...formData.constraints, z: e.target.checked}})} />
                        Z (Vertical)
                    </label>
                    <label>
                        <input type="checkbox" checked=${formData.constraints.r} 
                               onChange=${(e) => setFormData({...formData, constraints: {...formData.constraints, r: e.target.checked}})} />
                        R (Rotation)
                    </label>
                </div>
                
                <div class="form-section">
                    <h4>Loads</h4>
                    <label>Fx (Horizontal Force): 
                        <input type="number" value=${formData.loads.fx} step="0.1"
                               onChange=${(e) => setFormData({...formData, loads: {...formData.loads, fx: parseFloat(e.target.value) || 0}})} />
                    </label>
                    <label>Fz (Vertical Force): 
                        <input type="number" value=${formData.loads.fz} step="0.1"
                               onChange=${(e) => setFormData({...formData, loads: {...formData.loads, fz: parseFloat(e.target.value) || 0}})} />
                    </label>
                    <label>M (Moment): 
                        <input type="number" value=${formData.loads.m} step="0.1"
                               onChange=${(e) => setFormData({...formData, loads: {...formData.loads, m: parseFloat(e.target.value) || 0}})} />
                    </label>
                </div>
                
                <div class="form-actions">
                    <button onClick=${handleApply}>Apply</button>
                    <button onClick=${onCancel}>Cancel</button>
                </div>
            </div>
        </div>
    `;
}

// Application modes
const MODES = {
    SELECT: 'select',
    ADD_NODE: 'addNode'
};

// URL parameter utilities
const getModelIdFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('model');
};

const setModelIdInUrl = (modelId) => {
    const url = new URL(window.location);
    if (modelId) {
        url.searchParams.set('model', modelId);
    } else {
        url.searchParams.delete('model');
    }
    window.history.replaceState({}, '', url);
};

// Coordinate transformation utilities
const screenToWorld = (screenX, screenZ, viewport, dimensions) => {
    return {
        x: (screenX - dimensions.width / 2) / viewport.zoom + viewport.pan.x,
        z: (screenZ - dimensions.height / 2) / viewport.zoom + viewport.pan.z
    };
};

const worldToScreen = (worldX, worldZ, viewport, dimensions) => {
    return {
        x: (worldX - viewport.pan.x) * viewport.zoom + dimensions.width / 2,
        z: (worldZ - viewport.pan.z) * viewport.zoom + dimensions.height / 2
    };
};

// Adaptive grid spacing calculation
const calculateGridSpacing = (baseGridSize, zoom) => {
    // Target: 20-100 pixels between grid lines on screen
    let gridSpacing = baseGridSize;
    
    // If grid is too dense, increase spacing
    while (gridSpacing * zoom < 20 && gridSpacing < 1e6) {
        gridSpacing *= 2;
    }
    
    // If grid is too coarse, decrease spacing
    while (gridSpacing * zoom > 100 && gridSpacing > 1e-6) {
        gridSpacing /= 2;
    }
    
    return gridSpacing;
};

// Enhanced node rendering with JBeam-compatible symbols
const renderNode = (node, screen, viewport) => {
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
    
    // Constraint symbols (based on JBeam NodeRenderer reference)
    if (node.constraints.x && node.constraints.z && node.constraints.r) {
        // Full constraint - upside-down T with cross-hatched base
        elements.push(html`
            <g class="constraint-symbol">
                <!-- Vertical post of the T -->
                <line x1="${screen.x}" y1="${screen.z + nodeRadius + 2}" x2="${screen.x}" y2="${screen.z + nodeRadius + 16}" stroke-width="2" />
                <!-- Horizontal base of the T -->
                <line x1="${screen.x - 10}" y1="${screen.z + nodeRadius + 16}" x2="${screen.x + 10}" y2="${screen.z + nodeRadius + 16}" stroke-width="2" />
                <!-- Cross-hatched fill (diagonal lines) -->
                <line x1="${screen.x - 8}" y1="${screen.z + nodeRadius + 18}" x2="${screen.x - 2}" y2="${screen.z + nodeRadius + 24}" stroke-width="1" />
                <line x1="${screen.x - 6}" y1="${screen.z + nodeRadius + 18}" x2="${screen.x}" y2="${screen.z + nodeRadius + 24}" stroke-width="1" />
                <line x1="${screen.x - 4}" y1="${screen.z + nodeRadius + 18}" x2="${screen.x + 2}" y2="${screen.z + nodeRadius + 24}" stroke-width="1" />
                <line x1="${screen.x - 2}" y1="${screen.z + nodeRadius + 18}" x2="${screen.x + 4}" y2="${screen.z + nodeRadius + 24}" stroke-width="1" />
                <line x1="${screen.x}" y1="${screen.z + nodeRadius + 18}" x2="${screen.x + 6}" y2="${screen.z + nodeRadius + 24}" stroke-width="1" />
                <line x1="${screen.x + 2}" y1="${screen.z + nodeRadius + 18}" x2="${screen.x + 8}" y2="${screen.z + nodeRadius + 24}" stroke-width="1" />
                <!-- Cross-hatched fill (opposite diagonal lines) -->
                <line x1="${screen.x - 2}" y1="${screen.z + nodeRadius + 18}" x2="${screen.x - 8}" y2="${screen.z + nodeRadius + 24}" stroke-width="1" />
                <line x1="${screen.x}" y1="${screen.z + nodeRadius + 18}" x2="${screen.x - 6}" y2="${screen.z + nodeRadius + 24}" stroke-width="1" />
                <line x1="${screen.x + 2}" y1="${screen.z + nodeRadius + 18}" x2="${screen.x - 4}" y2="${screen.z + nodeRadius + 24}" stroke-width="1" />
                <line x1="${screen.x + 4}" y1="${screen.z + nodeRadius + 18}" x2="${screen.x - 2}" y2="${screen.z + nodeRadius + 24}" stroke-width="1" />
                <line x1="${screen.x + 6}" y1="${screen.z + nodeRadius + 18}" x2="${screen.x}" y2="${screen.z + nodeRadius + 24}" stroke-width="1" />
                <line x1="${screen.x + 8}" y1="${screen.z + nodeRadius + 18}" x2="${screen.x + 2}" y2="${screen.z + nodeRadius + 24}" stroke-width="1" />
            </g>
        `);
    } else if (node.constraints.x && node.constraints.z) {
        // XZ constrained (pinned) - triangle outline with cross-hatched base
        elements.push(html`
            <g class="constraint-symbol">
                <!-- Triangle outline (no fill) -->
                <polygon fill="none" stroke-width="2"
                         points="${screen.x},${screen.z + nodeRadius + 2} ${screen.x - 8},${screen.z + nodeRadius + 14} ${screen.x + 8},${screen.z + nodeRadius + 14}" />
                <!-- Cross-hatched base (same as fully constrained) -->
                <line x1="${screen.x - 6}" y1="${screen.z + nodeRadius + 16}" x2="${screen.x}" y2="${screen.z + nodeRadius + 22}" stroke-width="1" />
                <line x1="${screen.x - 4}" y1="${screen.z + nodeRadius + 16}" x2="${screen.x + 2}" y2="${screen.z + nodeRadius + 22}" stroke-width="1" />
                <line x1="${screen.x - 2}" y1="${screen.z + nodeRadius + 16}" x2="${screen.x + 4}" y2="${screen.z + nodeRadius + 22}" stroke-width="1" />
                <line x1="${screen.x}" y1="${screen.z + nodeRadius + 16}" x2="${screen.x + 6}" y2="${screen.z + nodeRadius + 22}" stroke-width="1" />
                <!-- Cross-hatched base (opposite diagonal) -->
                <line x1="${screen.x}" y1="${screen.z + nodeRadius + 16}" x2="${screen.x - 6}" y2="${screen.z + nodeRadius + 22}" stroke-width="1" />
                <line x1="${screen.x + 2}" y1="${screen.z + nodeRadius + 16}" x2="${screen.x - 4}" y2="${screen.z + nodeRadius + 22}" stroke-width="1" />
                <line x1="${screen.x + 4}" y1="${screen.z + nodeRadius + 16}" x2="${screen.x - 2}" y2="${screen.z + nodeRadius + 22}" stroke-width="1" />
                <line x1="${screen.x + 6}" y1="${screen.z + nodeRadius + 16}" x2="${screen.x}" y2="${screen.z + nodeRadius + 22}" stroke-width="1" />
            </g>
        `);
    } else if (node.constraints.x && !node.constraints.z) {
        // X constrained only (horizontal roller) - triangle with slider line
        elements.push(html`
            <g class="constraint-symbol">
                <!-- Triangle outline (no fill) -->
                <polygon fill="none" stroke-width="2"
                         points="${screen.x},${screen.z + nodeRadius + 2} ${screen.x - 8},${screen.z + nodeRadius + 14} ${screen.x + 8},${screen.z + nodeRadius + 14}" />
                <!-- Slider line parallel to triangle base -->
                <line x1="${screen.x - 8}" y1="${screen.z + nodeRadius + 18}" x2="${screen.x + 8}" y2="${screen.z + nodeRadius + 18}" stroke-width="2" />
            </g>
        `);
    } else if (!node.constraints.x && node.constraints.z) {
        // Z constrained only (vertical roller) - triangle rotated 90° CCW with slider line
        elements.push(html`
            <g class="constraint-symbol">
                <!-- Triangle pointing right (rotated 90° CCW) -->
                <polygon fill="none" stroke-width="2"
                         points="${screen.x + nodeRadius + 2},${screen.z} ${screen.x + nodeRadius + 14},${screen.z - 8} ${screen.x + nodeRadius + 14},${screen.z + 8}" />
                <!-- Slider line parallel to triangle base (vertical) -->
                <line x1="${screen.x + nodeRadius + 18}" y1="${screen.z - 8}" x2="${screen.x + nodeRadius + 18}" y2="${screen.z + 8}" stroke-width="2" />
            </g>
        `);
    } else if (!node.constraints.x && node.constraints.z && node.constraints.r) {
        // ZR constrained (Z + rotation) - triangle rotated 90° CCW with slider line (same as Z only)
        elements.push(html`
            <g class="constraint-symbol">
                <!-- Triangle pointing right (rotated 90° CCW) -->
                <polygon fill="none" stroke-width="2"
                         points="${screen.x + nodeRadius + 2},${screen.z} ${screen.x + nodeRadius + 14},${screen.z - 8} ${screen.x + nodeRadius + 14},${screen.z + 8}" />
                <!-- Slider line parallel to triangle base (vertical) -->
                <line x1="${screen.x + nodeRadius + 18}" y1="${screen.z - 8}" x2="${screen.x + nodeRadius + 18}" y2="${screen.z + 8}" stroke-width="2" />
            </g>
        `);
    } else if (node.constraints.x && !node.constraints.z && node.constraints.r) {
        // XR constrained (X + rotation) - triangle with slider line (same as X only)
        elements.push(html`
            <g class="constraint-symbol">
                <!-- Triangle outline (no fill) -->
                <polygon fill="none" stroke-width="2"
                         points="${screen.x},${screen.z + nodeRadius + 2} ${screen.x - 8},${screen.z + nodeRadius + 14} ${screen.x + 8},${screen.z + nodeRadius + 14}" />
                <!-- Slider line parallel to triangle base -->
                <line x1="${screen.x - 8}" y1="${screen.z + nodeRadius + 18}" x2="${screen.x + 8}" y2="${screen.z + nodeRadius + 18}" stroke-width="2" />
            </g>
        `);
    } else if (!node.constraints.x && !node.constraints.z && node.constraints.r) {
        // R constrained only (rotation constraint) - small square at node center
        elements.push(html`
            <rect class="constraint-symbol" x="${screen.x - 3}" y="${screen.z - 3}" width="6" height="6" fill="none" stroke-width="2" />
        `);
    }
    
    // Force vectors
    if (Math.abs(node.loads.fx) > 0.001 || Math.abs(node.loads.fz) > 0.001) {
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
                    <line x1=${startX} y1=${startZ} x2=${screen.x} y2=${screen.z} stroke="var(--moment-color)" stroke-width="2" marker-end="url(#arrowhead)" />
                    <text x=${screen.x + 8} y=${screen.z - 8} class="force-label" fill="var(--moment-color)">
                        ${Math.round(Math.sqrt(node.loads.fx * node.loads.fx + node.loads.fz * node.loads.fz) * 100) / 100}
                    </text>
                </g>
            `);
        }
    }
    
    // Moment symbol
    if (Math.abs(node.loads.m) > 0.001) {
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
                <polygon points="${screen.x + momentRadius - 2},${clockwise ? screen.z + 2 : screen.z - 2} ${screen.x + momentRadius + 2},${screen.z} ${screen.x + momentRadius - 2},${clockwise ? screen.z - 2 : screen.z + 2}" 
                         fill="none" stroke="var(--moment-color)" stroke-width="1" />
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

// Main App component
export function App() {
    const [showAbout, setShowAbout] = useState(false);
    const [theme, setTheme] = useState('light');
    const [applicationMode, setApplicationMode] = useState(MODES.SELECT);
    const [modelId, setModelId] = useState(null);
    const [model, setModel] = useState({
        version: "1.0",
        modelType: "structural",
        nodes: [],
        beams: []
    });
    const [cursorCoordinates, setCursorCoordinates] = useState({ x: 0, z: 0 });
    const [viewport, setViewport] = useState({
        pan: { x: 0, z: 0 },        // World coordinate offset
        zoom: 1.0,                  // Zoom level (1.0 = 100%)
        minZoom: 1e-8,              // Minimum zoom level for dimensionless analysis
        maxZoom: 1e+8               // Maximum zoom level for dimensionless analysis
    });
    const [selectedNode, setSelectedNode] = useState(null);
    const [showNodeEditor, setShowNodeEditor] = useState(false);

    // Initialize theme from localStorage and system preference
    useEffect(() => {
        const savedTheme = localStorage.getItem('jsbeam-theme');
        const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const initialTheme = savedTheme || systemPreference;
        setTheme(initialTheme);
        document.documentElement.className = initialTheme === 'dark' ? 'dark-theme' : '';
    }, []);

    // Initialize model from URL or create new one
    useEffect(() => {
        const urlModelId = getModelIdFromUrl();
        
        if (urlModelId) {
            // Try to load existing model
            const savedModel = localStorage.getItem(`jsbeam-model-${urlModelId}`);
            if (savedModel) {
                try {
                    const parsedModel = JSON.parse(savedModel);
                    setModel(parsedModel);
                    setModelId(urlModelId);
                } catch (error) {
                    console.error('Failed to parse saved model:', error);
                    // Fall back to new model
                    const newModelId = `${Date.now()}`;
                    setModelId(newModelId);
                    setModelIdInUrl(newModelId);
                }
            } else {
                // Model ID in URL but no saved data - start fresh with this ID
                setModelId(urlModelId);
            }
        } else {
            // No model ID in URL - create new model
            const newModelId = `${Date.now()}`;
            setModelId(newModelId);
            setModelIdInUrl(newModelId);
        }
    }, []);

    // Save model to localStorage when it changes (but only if we have a modelId)
    useEffect(() => {
        if (modelId) {
            localStorage.setItem(`jsbeam-model-${modelId}`, JSON.stringify(model));
        }
    }, [model, modelId]);

    // Keyboard shortcuts for mode switching
    useEffect(() => {
        const handleKeyPress = (event) => {
            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case '1':
                        event.preventDefault();
                        setApplicationMode(MODES.SELECT);
                        break;
                    case '2':
                        event.preventDefault();
                        setApplicationMode(MODES.ADD_NODE);
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, []);

    // Update theme and persist to localStorage
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('jsbeam-theme', newTheme);
        document.documentElement.className = newTheme === 'dark' ? 'dark-theme' : '';
    };

    // Add node to model
    const addNode = (coordinates) => {
        const nodeId = `node-${Date.now()}`;
        const newNode = {
            id: nodeId,
            label: "", // Empty label by default
            coordinates: {
                x: coordinates.x,
                z: coordinates.z
            },
            constraints: {
                x: false,
                z: false,
                r: false
            },
            loads: {
                fx: 0.0,
                fz: 0.0,
                m: 0.0
            }
        };
        
        setModel(prevModel => ({
            ...prevModel,
            nodes: [...prevModel.nodes, newNode]
        }));
    };

    // Create new model
    const createNewModel = () => {
        const newModelId = `${Date.now()}`;
        setModelId(newModelId);
        setModelIdInUrl(newModelId);
        setModel({
            version: "1.0",
            modelType: "structural",
            nodes: [],
            beams: []
        });
        setApplicationMode(MODES.SELECT);
    };

    // Zoom functions
    const zoomIn = () => {
        const zoomFactor = 1.5;
        const newZoom = Math.min(viewport.maxZoom, viewport.zoom * zoomFactor);
        
        setViewport(prev => ({
            ...prev,
            zoom: newZoom
        }));
    };

    const zoomOut = () => {
        const zoomFactor = 1 / 1.5;
        const newZoom = Math.max(viewport.minZoom, viewport.zoom * zoomFactor);
        
        setViewport(prev => ({
            ...prev,
            zoom: newZoom
        }));
    };

    const zoomFit = () => {
        if (model.nodes.length === 0) {
            setViewport(prev => ({
                ...prev,
                zoom: 1.0,
                pan: { x: 0, z: 0 }
            }));
            return;
        }

        // Calculate model bounds
        const bounds = model.nodes.reduce((acc, node) => ({
            minX: Math.min(acc.minX, node.coordinates.x),
            maxX: Math.max(acc.maxX, node.coordinates.x),
            minZ: Math.min(acc.minZ, node.coordinates.z),
            maxZ: Math.max(acc.maxZ, node.coordinates.z)
        }), {
            minX: model.nodes[0].coordinates.x,
            maxX: model.nodes[0].coordinates.x,
            minZ: model.nodes[0].coordinates.z,
            maxZ: model.nodes[0].coordinates.z
        });

        // Add padding
        const padding = 50;
        const modelWidth = bounds.maxX - bounds.minX + padding * 2;
        const modelHeight = bounds.maxZ - bounds.minZ + padding * 2;
        
        // Get current dimensions (use default if not available)
        const contentArea = document.querySelector('.content-area');
        const viewWidth = contentArea ? contentArea.clientWidth : 800;
        const viewHeight = contentArea ? contentArea.clientHeight : 600;
        
        // Calculate zoom to fit
        const zoomX = viewWidth / modelWidth;
        const zoomZ = viewHeight / modelHeight;
        const fitZoom = Math.min(zoomX, zoomZ, viewport.maxZoom);
        
        // Center on model
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerZ = (bounds.minZ + bounds.maxZ) / 2;
        
        setViewport({
            ...viewport,
            zoom: fitZoom,
            pan: { x: centerX, z: centerZ }
        });
    };

    const zoomActual = () => {
        setViewport(prev => ({
            ...prev,
            zoom: 1.0
        }));
    };

    // Handle node right-click for property editing
    const handleNodeContextMenu = (event, node) => {
        event.preventDefault();
        
        // Switch to select mode
        if (applicationMode !== MODES.SELECT) {
            setApplicationMode(MODES.SELECT);
        }
        
        // Open property editor for this node
        setSelectedNode(node);
        setShowNodeEditor(true);
    };

    // Update node properties
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

    // Handle node properties apply
    const handleNodePropertiesApply = (formData) => {
        if (selectedNode) {
            updateNodeProperties(selectedNode.id, formData);
            setShowNodeEditor(false);
            setSelectedNode(null);
        }
    };

    // Handle node properties cancel
    const handleNodePropertiesCancel = () => {
        setShowNodeEditor(false);
        setSelectedNode(null);
    };

    return html`
        <div class="app">
            <${MenuBar} 
                onAbout=${() => setShowAbout(true)} 
                onToggleTheme=${toggleTheme} 
                currentTheme=${theme}
                applicationMode=${applicationMode}
                onModeChange=${setApplicationMode}
                onFileNew=${createNewModel}
                viewport=${viewport}
                onZoomIn=${zoomIn}
                onZoomOut=${zoomOut}
                onZoomFit=${zoomFit}
                onZoomActual=${zoomActual}
            />
            <${ContentArea} 
                applicationMode=${applicationMode}
                model=${model}
                onAddNode=${addNode}
                onCursorMove=${setCursorCoordinates}
                viewport=${viewport}
                onViewportChange=${setViewport}
                onNodeContextMenu=${handleNodeContextMenu}
            />
            <${StatusBar} 
                applicationMode=${applicationMode}
                cursorCoordinates=${cursorCoordinates}
                model=${model}
                viewport=${viewport}
            />
            <${AboutDialog} isOpen=${showAbout} onClose=${() => setShowAbout(false)} />
            <${NodePropertiesEditor} 
                node=${selectedNode}
                isOpen=${showNodeEditor}
                onApply=${handleNodePropertiesApply}
                onCancel=${handleNodePropertiesCancel}
            />
        </div>
    `;
}
