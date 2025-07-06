import { screenToWorld, worldToScreen, MODES, clamp } from './util.js';

// Viewport interaction handling
export const createViewportHandler = (viewport, setViewport, dimensions) => {
    let isPanning = false;
    let panStart = null;

    const handleMouseDown = (event) => {
        if (event.button === 1) { // Middle mouse button
            isPanning = true;
            panStart = {
                x: event.clientX,
                z: event.clientY,
                viewport: { ...viewport }
            };
            event.preventDefault();
            return { isPanning: true, panStart };
        }
        return { isPanning: false, panStart: null };
    };

    const handleMouseMove = (event, cursorCallback) => {
        const rect = event.currentTarget.getBoundingClientRect();
        
        if (isPanning && panStart) {
            const deltaX = (event.clientX - panStart.x) / viewport.zoom;
            const deltaZ = (event.clientY - panStart.z) / viewport.zoom;
            
            const newViewport = {
                ...viewport,
                pan: {
                    x: panStart.viewport.pan.x - deltaX,
                    z: panStart.viewport.pan.z - deltaZ
                }
            };
            
            setViewport(newViewport);
        }
        
        // Update cursor coordinates in world space
        if (cursorCallback) {
            const screenX = event.clientX - rect.left;
            const screenZ = event.clientY - rect.top;
            const worldCoords = screenToWorld(screenX, screenZ, viewport, dimensions);
            cursorCallback(worldCoords);
        }
    };

    const handleMouseUp = (event) => {
        if (event.button === 1) { // Middle mouse button
            isPanning = false;
            panStart = null;
            return { isPanning: false, panStart: null };
        }
        return { isPanning, panStart };
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
            const newZoom = clamp(
                viewport.zoom * zoomFactor,
                viewport.minZoom,
                viewport.maxZoom
            );
            
            // Calculate new pan to keep mouse position fixed
            const mouseWorldAfter = screenToWorld(mouseScreen.x, mouseScreen.z, { ...viewport, zoom: newZoom }, dimensions);
            const panAdjustment = {
                x: mouseWorldBefore.x - mouseWorldAfter.x,
                z: mouseWorldBefore.z - mouseWorldAfter.z
            };
            
            setViewport({
                ...viewport,
                zoom: newZoom,
                pan: {
                    x: viewport.pan.x + panAdjustment.x,
                    z: viewport.pan.z + panAdjustment.z
                }
            });
        }
    };

    return {
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleWheel,
        isPanning,
        panStart
    };
};

// Mode-specific interaction handling
export const createModeHandler = (applicationMode, model, setModel, viewport, dimensions) => {
    const handleClick = (event, isPanning) => {
        if (isPanning) return; // Don't handle clicks during panning
        
        const rect = event.currentTarget.getBoundingClientRect();
        const screenX = event.clientX - rect.left;
        const screenZ = event.clientY - rect.top;
        const worldCoords = screenToWorld(screenX, screenZ, viewport, dimensions);
        
        switch (applicationMode) {
            case MODES.ADD_NODE:
                return handleAddNodeClick(worldCoords, model, setModel);
            case MODES.SELECT:
                return handleSelectClick(event, worldCoords);
            default:
                break;
        }
    };

    return { handleClick };
};

// Add node interaction
const handleAddNodeClick = (coordinates, model, setModel) => {
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
    
    return newNode;
};

// Select mode interaction
const handleSelectClick = (event, worldCoords) => {
    // Future implementation for selection handling
    // Will need to check for clicks on nodes, beams, etc.
    return null;
};

// Node context menu handling
export const createNodeContextHandler = (setApplicationMode, setSelectedNode, setShowNodeEditor) => {
    const handleNodeContextMenu = (event, node) => {
        event.preventDefault();
        
        // Switch to select mode
        setApplicationMode(MODES.SELECT);
        
        // Open property editor for this node
        setSelectedNode(node);
        setShowNodeEditor(true);
    };

    return { handleNodeContextMenu };
};

// Keyboard interaction handling
export const createKeyboardHandler = (setApplicationMode) => {
    const handleKeyDown = (event) => {
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
                default:
                    break;
            }
        }
        
        // Handle other keys
        switch (event.key) {
            case 'Escape':
                // Cancel current operation
                setApplicationMode(MODES.SELECT);
                break;
            default:
                break;
        }
    };

    return { handleKeyDown };
};

// Zoom control functions
export const createZoomControls = (viewport, setViewport, model, dimensions) => {
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
        const viewWidth = contentArea ? contentArea.clientWidth : dimensions?.width || 800;
        const viewHeight = contentArea ? contentArea.clientHeight : dimensions?.height || 600;
        
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

    return {
        zoomIn,
        zoomOut,
        zoomFit,
        zoomActual
    };
};

// Selection handling (future implementation)
export const createSelectionHandler = () => {
    const selectNode = (node) => {
        // Implementation for node selection
    };

    const selectBeam = (beam) => {
        // Implementation for beam selection
    };

    const clearSelection = () => {
        // Implementation for clearing selection
    };

    const selectMultiple = (items) => {
        // Implementation for multiple selection
    };

    return {
        selectNode,
        selectBeam,
        clearSelection,
        selectMultiple
    };
};

// Drag and drop handling (future implementation)
export const createDragHandler = () => {
    const startDrag = (item, startPosition) => {
        // Implementation for starting drag operation
    };

    const updateDrag = (currentPosition) => {
        // Implementation for updating drag operation
    };

    const endDrag = (endPosition) => {
        // Implementation for ending drag operation
    };

    return {
        startDrag,
        updateDrag,
        endDrag
    };
};

// Touch interaction handling (future implementation)
export const createTouchHandler = () => {
    const handleTouchStart = (event) => {
        // Implementation for touch start
    };

    const handleTouchMove = (event) => {
        // Implementation for touch move (pan/zoom)
    };

    const handleTouchEnd = (event) => {
        // Implementation for touch end
    };

    return {
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd
    };
};

// Hit testing utilities
export const hitTestNode = (screenPoint, nodes, viewport, dimensions, tolerance = 15) => {
    for (const node of nodes) {
        const nodeScreen = worldToScreen(node.coordinates.x, node.coordinates.z, viewport, dimensions);
        const distance = Math.sqrt(
            Math.pow(screenPoint.x - nodeScreen.x, 2) + 
            Math.pow(screenPoint.z - nodeScreen.z, 2)
        );
        
        if (distance <= tolerance) {
            return node;
        }
    }
    return null;
};

export const hitTestBeam = (screenPoint, beams, nodes, viewport, dimensions, tolerance = 5) => {
    for (const beam of beams) {
        const startNode = nodes.find(n => n.id === beam.startNode);
        const endNode = nodes.find(n => n.id === beam.endNode);
        
        if (!startNode || !endNode) continue;
        
        const startScreen = worldToScreen(startNode.coordinates.x, startNode.coordinates.z, viewport, dimensions);
        const endScreen = worldToScreen(endNode.coordinates.x, endNode.coordinates.z, viewport, dimensions);
        
        // Calculate distance from point to line segment
        const distance = distanceToLineSegment(screenPoint, startScreen, endScreen);
        
        if (distance <= tolerance) {
            return beam;
        }
    }
    return null;
};

// Helper function for distance calculation
const distanceToLineSegment = (point, lineStart, lineEnd) => {
    const A = point.x - lineStart.x;
    const B = point.z - lineStart.z;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.z - lineStart.z;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
        param = dot / lenSq;
    }

    let xx, zz;

    if (param < 0) {
        xx = lineStart.x;
        zz = lineStart.z;
    } else if (param > 1) {
        xx = lineEnd.x;
        zz = lineEnd.z;
    } else {
        xx = lineStart.x + param * C;
        zz = lineStart.z + param * D;
    }

    const dx = point.x - xx;
    const dz = point.z - zz;
    
    return Math.sqrt(dx * dx + dz * dz);
};