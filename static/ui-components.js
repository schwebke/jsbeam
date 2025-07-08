import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';
import { MODES, TRUSS_STATES, validateNodeProperties, worldToScreen } from './util.js';
import { svgMarkers, renderGrid, renderNodes, renderBeams, renderNode, renderTrussPreview } from './render.js';
import { createViewportHandler, createModeHandler, createNodeContextHandler, createTrussHandler } from './interact.js';

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
                        <div class="dropdown-item" onClick=${handleModeSelect(MODES.SELECT)}>
                            ${applicationMode === MODES.SELECT ? '✓ ' : ''}Select
                        </div>
                        <div class="dropdown-item" onClick=${handleModeSelect(MODES.ADD_NODE)}>
                            ${applicationMode === MODES.ADD_NODE ? '✓ ' : ''}Add Node
                        </div>
                        <div class="dropdown-item" onClick=${handleModeSelect(MODES.ADD_TRUSS)}>
                            ${applicationMode === MODES.ADD_TRUSS ? '✓ ' : ''}Add Truss
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
    let modeDisplay = 'Select';
    if (applicationMode === MODES.ADD_NODE) {
        modeDisplay = 'Add Node';
    } else if (applicationMode === MODES.ADD_TRUSS) {
        modeDisplay = 'Add Truss';
    }
    const zoomPercent = Math.round(viewport.zoom * 100);
    
    return html`
        <div class="statusbar">
            Mode: ${modeDisplay} | X: ${Math.round(cursorCoordinates.x)}, Z: ${Math.round(cursorCoordinates.z)} | Zoom: ${zoomPercent}% | Nodes: ${model.nodes.length}, Beams: ${model.beams.length}
        </div>
    `;
}

// ContentArea component with SVG point grid
export function ContentArea({ applicationMode, model, onAddNode, onCursorMove, viewport, onViewportChange, onNodeContextMenu, onAddTruss }) {
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState(null);
    
    // Truss mode state
    const [trussState, setTrussState] = useState(TRUSS_STATES.SELECTING_START_NODE);
    const [startNode, setStartNode] = useState(null);
    const [mousePosition, setMousePosition] = useState(null);
    
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

    // Create truss handler
    const trussHandler = createTrussHandler(applicationMode, model, onAddTruss, viewport, dimensions);
    
    // Reset truss state when switching modes
    useEffect(() => {
        if (applicationMode !== MODES.ADD_TRUSS) {
            trussHandler.cancelTrussOperation(setTrussState, setStartNode, setMousePosition);
        }
    }, [applicationMode]);

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
        const worldCoords = {
            x: (screenX - dimensions.width / 2) / viewport.zoom + viewport.pan.x,
            z: (screenZ - dimensions.height / 2) / viewport.zoom + viewport.pan.z
        };
        onCursorMove(worldCoords);
        
        // Handle truss preview
        trussHandler.handleTrussMouseMove(event, trussState, setMousePosition);
    };

    const handleMouseUp = (event) => {
        if (event.button === 1) { // Middle mouse button
            setIsPanning(false);
            setPanStart(null);
        }
    };

    const handleClick = (event) => {
        if (!isPanning) {
            if (applicationMode === MODES.ADD_NODE) {
                const rect = event.currentTarget.getBoundingClientRect();
                const screenX = event.clientX - rect.left;
                const screenZ = event.clientY - rect.top;
                const worldCoords = {
                    x: (screenX - dimensions.width / 2) / viewport.zoom + viewport.pan.x,
                    z: (screenZ - dimensions.height / 2) / viewport.zoom + viewport.pan.z
                };
                onAddNode(worldCoords);
            } else if (applicationMode === MODES.ADD_TRUSS) {
                trussHandler.handleTrussInteraction(event, trussState, setTrussState, startNode, setStartNode, mousePosition, setMousePosition);
            }
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
            const mouseWorldBefore = {
                x: (mouseScreen.x - dimensions.width / 2) / viewport.zoom + viewport.pan.x,
                z: (mouseScreen.z - dimensions.height / 2) / viewport.zoom + viewport.pan.z
            };
            
            // Calculate new zoom level
            const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
            const newZoom = Math.max(
                viewport.minZoom,
                Math.min(viewport.maxZoom, viewport.zoom * zoomFactor)
            );
            
            // Calculate new pan to keep mouse position fixed
            const mouseWorldAfter = {
                x: (mouseScreen.x - dimensions.width / 2) / newZoom + viewport.pan.x,
                z: (mouseScreen.z - dimensions.height / 2) / newZoom + viewport.pan.z
            };
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

    const handleNodeContextMenu = (event, node) => {
        if (onNodeContextMenu) {
            onNodeContextMenu(event, node);
        }
    };

    const getCSSClass = () => {
        let cssClass = 'content-area';
        if (applicationMode === MODES.ADD_NODE) cssClass += ' mode-addNode';
        if (applicationMode === MODES.ADD_TRUSS) cssClass += ' mode-addTruss';
        if (isPanning) cssClass += ' panning';
        return cssClass;
    };

    return html`
        <div class=${getCSSClass()} 
             onMouseDown=${handleMouseDown} 
             onMouseMove=${handleMouseMove} 
             onMouseUp=${handleMouseUp}
             onClick=${handleClick}
             onWheel=${handleWheel}>
            <svg width="100%" height="100%" viewBox="0 0 ${dimensions.width} ${dimensions.height}">
                ${svgMarkers}
                ${renderGrid(viewport, dimensions)}
                ${renderBeams(model.beams, model.nodes, viewport, dimensions)}
                ${model.nodes.map(node => {
                    const screen = worldToScreen(node.coordinates.x, node.coordinates.z, viewport, dimensions);
                    return html`
                        <g class="node-group" onContextMenu=${(e) => handleNodeContextMenu(e, node)}>
                            ${renderNode(node, screen, viewport)}
                        </g>
                    `;
                })}
                ${applicationMode === MODES.ADD_TRUSS && startNode && mousePosition && 
                    renderTrussPreview(startNode, mousePosition, viewport, dimensions)
                }
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

// Beam Properties Editor component (future implementation)
export function BeamPropertiesEditor({ beam, isOpen, onApply, onCancel }) {
    if (!isOpen || !beam) return null;

    const [formData, setFormData] = useState({
        label: beam.label || '',
        properties: { ...beam.properties }
    });

    useEffect(() => {
        if (beam) {
            setFormData({
                label: beam.label || '',
                properties: { ...beam.properties }
            });
        }
    }, [beam]);

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
            <div class="modal-content beam-properties-editor" onClick=${(e) => e.stopPropagation()} onKeyDown=${handleKeyDown}>
                <h3>Beam Properties: ${beam.id}</h3>
                
                <div class="form-section">
                    <label>Label:</label>
                    <input type="text" value=${formData.label} 
                           onChange=${(e) => setFormData({...formData, label: e.target.value})} />
                </div>
                
                <div class="form-section">
                    <h4>Material Properties</h4>
                    <label>Material: 
                        <select value=${formData.properties.material} 
                                onChange=${(e) => setFormData({...formData, properties: {...formData.properties, material: e.target.value}})}>
                            <option value="steel">Steel</option>
                            <option value="concrete">Concrete</option>
                            <option value="wood">Wood</option>
                        </select>
                    </label>
                    <label>Elastic Modulus (E): 
                        <input type="number" value=${formData.properties.elasticModulus} 
                               onChange=${(e) => setFormData({...formData, properties: {...formData.properties, elasticModulus: parseFloat(e.target.value) || 0}})} />
                    </label>
                </div>
                
                <div class="form-section">
                    <h4>Cross Section</h4>
                    <label>Section Type: 
                        <select value=${formData.properties.section} 
                                onChange=${(e) => setFormData({...formData, properties: {...formData.properties, section: e.target.value}})}>
                            <option value="rectangular">Rectangular</option>
                            <option value="circular">Circular</option>
                            <option value="i-beam">I-Beam</option>
                        </select>
                    </label>
                    <label>Width: 
                        <input type="number" value=${formData.properties.width} step="0.01"
                               onChange=${(e) => setFormData({...formData, properties: {...formData.properties, width: parseFloat(e.target.value) || 0}})} />
                    </label>
                    <label>Height: 
                        <input type="number" value=${formData.properties.height} step="0.01"
                               onChange=${(e) => setFormData({...formData, properties: {...formData.properties, height: parseFloat(e.target.value) || 0}})} />
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

// Error dialog component
export function ErrorDialog({ error, isOpen, onClose }) {
    if (!isOpen || !error) return null;

    return html`
        <div class="modal-overlay" onClick=${onClose}>
            <div class="modal-content error-dialog" onClick=${(e) => e.stopPropagation()}>
                <h3>Error</h3>
                <p>${error.message || 'An unexpected error occurred'}</p>
                <div class="form-actions">
                    <button onClick=${onClose}>OK</button>
                </div>
            </div>
        </div>
    `;
}

// Loading spinner component
export function LoadingSpinner({ isVisible, message }) {
    if (!isVisible) return null;

    return html`
        <div class="modal-overlay">
            <div class="loading-spinner">
                <div class="spinner"></div>
                ${message && html`<p>${message}</p>`}
            </div>
        </div>
    `;
}

// Confirmation dialog component
export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return html`
        <div class="modal-overlay" onClick=${onCancel}>
            <div class="modal-content confirm-dialog" onClick=${(e) => e.stopPropagation()}>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="form-actions">
                    <button onClick=${onConfirm}>Yes</button>
                    <button onClick=${onCancel}>No</button>
                </div>
            </div>
        </div>
    `;
}