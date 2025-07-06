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
export function ContentArea({ applicationMode, model, onAddNode, onCursorMove, viewport, onViewportChange }) {
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
                ${points.map(([worldX, worldZ]) => {
                    const screen = worldToScreen(worldX, worldZ, viewport, dimensions);
                    return html`<circle cx=${screen.x} cy=${screen.z} r="0.5" fill="var(--grid-color)" vector-effect="non-scaling-stroke" />`;
                })}
                ${model.nodes.map(node => {
                    const screen = worldToScreen(node.coordinates.x, node.coordinates.z, viewport, dimensions);
                    return html`
                        <circle
                            cx=${screen.x}
                            cy=${screen.z}
                            r="6"
                            fill="none"
                            stroke="var(--accent-color)"
                            stroke-width="2"
                            class="node"
                        />
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
            label: `Node ${model.nodes.length + 1}`,
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
            />
            <${StatusBar} 
                applicationMode=${applicationMode}
                cursorCoordinates=${cursorCoordinates}
                model=${model}
                viewport=${viewport}
            />
            <${AboutDialog} isOpen=${showAbout} onClose=${() => setShowAbout(false)} />
        </div>
    `;
}