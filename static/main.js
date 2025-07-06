import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';
import { MenuBar, ContentArea, StatusBar, AboutDialog, NodePropertiesEditor } from './ui-components.js';
import { createModel, addNodeToModel, updateNodeInModel } from './model.js';
import { 
    getModelIdFromUrl, 
    setModelIdInUrl, 
    saveModelToStorage, 
    loadModelFromStorage,
    saveThemeToStorage,
    loadThemeFromStorage,
    getSystemThemePreference,
    applyTheme,
    MODES
} from './util.js';
import { createZoomControls, createKeyboardHandler, createNodeContextHandler } from './interact.js';

// Main App component
export function App() {
    const [showAbout, setShowAbout] = useState(false);
    const [theme, setTheme] = useState('light');
    const [applicationMode, setApplicationMode] = useState(MODES.SELECT);
    const [modelId, setModelId] = useState(null);
    const [model, setModel] = useState(createModel('default'));
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
        const savedTheme = loadThemeFromStorage();
        const systemPreference = getSystemThemePreference();
        const initialTheme = savedTheme || systemPreference;
        setTheme(initialTheme);
        applyTheme(initialTheme);
    }, []);

    // Initialize model from URL or create new one
    useEffect(() => {
        const urlModelId = getModelIdFromUrl();
        
        if (urlModelId) {
            // Try to load existing model
            const savedModel = loadModelFromStorage(urlModelId);
            if (savedModel) {
                try {
                    setModel(savedModel);
                    setModelId(urlModelId);
                } catch (error) {
                    console.error('Failed to parse saved model:', error);
                    // Fall back to new model
                    const newModelId = `${Date.now()}`;
                    const newModel = createModel(newModelId);
                    setModel(newModel);
                    setModelId(newModelId);
                    setModelIdInUrl(newModelId);
                }
            } else {
                // Model ID in URL but no saved data - start fresh with this ID
                const newModel = createModel(urlModelId);
                setModel(newModel);
                setModelId(urlModelId);
            }
        } else {
            // No model ID in URL - create new model
            const newModelId = `${Date.now()}`;
            const newModel = createModel(newModelId);
            setModel(newModel);
            setModelId(newModelId);
            setModelIdInUrl(newModelId);
        }
    }, []);

    // Save model to localStorage when it changes (but only if we have a modelId)
    useEffect(() => {
        if (modelId && model) {
            saveModelToStorage(modelId, model);
        }
    }, [model, modelId]);

    // Keyboard shortcuts for mode switching
    const keyboardHandler = createKeyboardHandler(setApplicationMode);
    useEffect(() => {
        document.addEventListener('keydown', keyboardHandler.handleKeyDown);
        return () => document.removeEventListener('keydown', keyboardHandler.handleKeyDown);
    }, []);

    // Update theme and persist to localStorage
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        saveThemeToStorage(newTheme);
        applyTheme(newTheme);
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
        const newModel = createModel(newModelId);
        setModelId(newModelId);
        setModelIdInUrl(newModelId);
        setModel(newModel);
        setApplicationMode(MODES.SELECT);
    };

    // Create zoom controls
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const zoomControls = createZoomControls(viewport, setViewport, model, dimensions);

    // Handle node right-click for property editing
    const nodeContextHandler = createNodeContextHandler(setApplicationMode, setSelectedNode, setShowNodeEditor);
    const handleNodeContextMenu = (event, node) => {
        nodeContextHandler.handleNodeContextMenu(event, node);
    };

    // Update node properties
    const updateNodeProperties = (nodeId, newProperties) => {
        try {
            const updatedModel = updateNodeInModel(model, nodeId, newProperties);
            setModel(updatedModel);
        } catch (error) {
            console.error('Failed to update node properties:', error);
            // Could show error dialog here
        }
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
                onZoomIn=${zoomControls.zoomIn}
                onZoomOut=${zoomControls.zoomOut}
                onZoomFit=${zoomControls.zoomFit}
                onZoomActual=${zoomControls.zoomActual}
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