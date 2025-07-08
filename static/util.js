// Coordinate transformation utilities
export const screenToWorld = (screenX, screenZ, viewport, dimensions) => {
    return {
        x: (screenX - dimensions.width / 2) / viewport.zoom + viewport.pan.x,
        z: (screenZ - dimensions.height / 2) / viewport.zoom + viewport.pan.z
    };
};

export const worldToScreen = (worldX, worldZ, viewport, dimensions) => {
    return {
        x: (worldX - viewport.pan.x) * viewport.zoom + dimensions.width / 2,
        z: (worldZ - viewport.pan.z) * viewport.zoom + dimensions.height / 2
    };
};

// Adaptive grid spacing calculation
export const calculateGridSpacing = (baseGridSize, zoom) => {
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

// URL parameter utilities
export const getModelIdFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('model');
};

export const setModelIdInUrl = (modelId) => {
    const url = new URL(window.location);
    if (modelId) {
        url.searchParams.set('model', modelId);
    } else {
        url.searchParams.delete('model');
    }
    window.history.replaceState({}, '', url);
};

// Validation utilities
export const validateCoordinates = (x, z) => {
    return typeof x === 'number' && typeof z === 'number' && 
           !isNaN(x) && !isNaN(z) && isFinite(x) && isFinite(z);
};

export const validateNodeProperties = (properties) => {
    const errors = [];
    
    // Validate coordinates
    if (!validateCoordinates(properties.coordinates.x, properties.coordinates.z)) {
        errors.push('Invalid coordinates');
    }
    
    // Validate loads
    if (typeof properties.loads.fx !== 'number' || !isFinite(properties.loads.fx)) {
        errors.push('Invalid horizontal force (Fx)');
    }
    if (typeof properties.loads.fz !== 'number' || !isFinite(properties.loads.fz)) {
        errors.push('Invalid vertical force (Fz)');
    }
    if (typeof properties.loads.m !== 'number' || !isFinite(properties.loads.m)) {
        errors.push('Invalid moment (M)');
    }
    
    // Validate constraints
    if (typeof properties.constraints.x !== 'boolean' ||
        typeof properties.constraints.z !== 'boolean' ||
        typeof properties.constraints.r !== 'boolean') {
        errors.push('Invalid constraint values');
    }
    
    return errors;
};

// Storage utilities
export const saveModelToStorage = (modelId, model) => {
    try {
        localStorage.setItem(`jsbeam-model-${modelId}`, JSON.stringify(model));
        return true;
    } catch (error) {
        console.error('Failed to save model to storage:', error);
        return false;
    }
};

export const loadModelFromStorage = (modelId) => {
    try {
        const savedModel = localStorage.getItem(`jsbeam-model-${modelId}`);
        return savedModel ? JSON.parse(savedModel) : null;
    } catch (error) {
        console.error('Failed to load model from storage:', error);
        return null;
    }
};

// Theme utilities
export const saveThemeToStorage = (theme) => {
    localStorage.setItem('jsbeam-theme', theme);
};

export const loadThemeFromStorage = () => {
    return localStorage.getItem('jsbeam-theme');
};

export const getSystemThemePreference = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyTheme = (theme) => {
    document.documentElement.className = theme === 'dark' ? 'dark-theme' : '';
};

// Application modes
export const MODES = {
    SELECT: 'select',
    ADD_NODE: 'addNode',
    ADD_TRUSS: 'addTruss'
};

// Truss selection states
export const TRUSS_STATES = {
    SELECTING_START_NODE: 'selectingStartNode',
    SELECTING_END_NODE: 'selectingEndNode'
};

// Mathematical utilities
export const clamp = (value, min, max) => {
    return Math.max(min, Math.min(max, value));
};

export const roundToDecimalPlaces = (value, decimals) => {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
};

// Performance utilities
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};