import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';

// MenuBar component
export function MenuBar({ onAbout, onToggleTheme, currentTheme, applicationMode, onModeChange, onFileNew }) {
    const [showFileMenu, setShowFileMenu] = useState(false);
    const [showHelpMenu, setShowHelpMenu] = useState(false);
    const [showModeMenu, setShowModeMenu] = useState(false);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.menu-item')) {
                setShowFileMenu(false);
                setShowHelpMenu(false);
                setShowModeMenu(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleFileMenuClick = (e) => {
        e.stopPropagation();
        setShowHelpMenu(false);
        setShowModeMenu(false);
        setShowFileMenu(!showFileMenu);
    };

    const handleModeMenuClick = (e) => {
        e.stopPropagation();
        setShowFileMenu(false);
        setShowHelpMenu(false);
        setShowModeMenu(!showModeMenu);
    };

    const handleHelpMenuClick = (e) => {
        e.stopPropagation();
        setShowFileMenu(false);
        setShowModeMenu(false);
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
export function StatusBar({ applicationMode, cursorCoordinates, model }) {
    const modeDisplay = applicationMode === 'select' ? 'Select' : 'Add Node';
    
    return html`
        <div class="statusbar">
            Mode: ${modeDisplay} | X: ${Math.round(cursorCoordinates.x)}, Z: ${Math.round(cursorCoordinates.z)} | Nodes: ${model.nodes.length}, Beams: ${model.beams.length}
        </div>
    `;
}

// ContentArea component with SVG point grid
export function ContentArea({ applicationMode, model, onAddNode, onCursorMove }) {
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const gridSize = 20;
    
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

    // Generate grid points based on current dimensions
    const points = [];
    for (let x = 0; x < dimensions.width; x += gridSize) {
        for (let y = 0; y < dimensions.height; y += gridSize) {
            points.push([x, y]);
        }
    }

    // Handle mouse events
    const handleMouseMove = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const z = event.clientY - rect.top;
        onCursorMove({ x, z });
    };

    const handleClick = (event) => {
        if (applicationMode === 'addNode') {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const z = event.clientY - rect.top;
            onAddNode({ x, z });
        }
    };

    return html`
        <div class="content-area ${applicationMode === 'addNode' ? 'mode-addNode' : ''}" onMouseMove=${handleMouseMove} onClick=${handleClick}>
            <svg width="100%" height="100%" viewBox="0 0 ${dimensions.width} ${dimensions.height}">
                ${points.map(([x, y]) => html`
                    <circle cx=${x} cy=${y} r="0.5" fill="var(--grid-color)" vector-effect="non-scaling-stroke" />
                `)}
                ${model.nodes.map(node => html`
                    <circle
                        cx=${node.coordinates.x}
                        cy=${node.coordinates.z}
                        r="6"
                        fill="none"
                        stroke="var(--accent-color)"
                        stroke-width="2"
                        class="node"
                    />
                `)}
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

    return html`
        <div class="app">
            <${MenuBar} 
                onAbout=${() => setShowAbout(true)} 
                onToggleTheme=${toggleTheme} 
                currentTheme=${theme}
                applicationMode=${applicationMode}
                onModeChange=${setApplicationMode}
                onFileNew=${createNewModel}
            />
            <${ContentArea} 
                applicationMode=${applicationMode}
                model=${model}
                onAddNode=${addNode}
                onCursorMove=${setCursorCoordinates}
            />
            <${StatusBar} 
                applicationMode=${applicationMode}
                cursorCoordinates=${cursorCoordinates}
                model=${model}
            />
            <${AboutDialog} isOpen=${showAbout} onClose=${() => setShowAbout(false)} />
        </div>
    `;
}