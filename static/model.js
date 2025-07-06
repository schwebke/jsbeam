import { validateNodeProperties } from './util.js';

// JBeam-compatible model structure
export const createModel = (id) => ({
    id,
    version: "1.0",
    modelType: "structural",
    name: `Model ${id}`,
    nodes: [],
    beams: [],
    loads: [],
    constraints: [],
    results: null
});

// Node data structure
export const createNode = (coordinates, id) => ({
    id: id || `node-${Date.now()}`,
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
});

// Beam data structure (future)
export const createBeam = (startNodeId, endNodeId, id) => ({
    id: id || `beam-${Date.now()}`,
    label: "",
    startNode: startNodeId,
    endNode: endNodeId,
    properties: {
        material: "steel",
        section: "rectangular",
        width: 1.0,
        height: 1.0,
        elasticModulus: 200000,
        momentOfInertia: 1.0
    }
});

// Load data structure (future)
export const createLoad = (nodeId, type, value, id) => ({
    id: id || `load-${Date.now()}`,
    nodeId,
    type, // 'force', 'moment', 'distributed'
    value,
    direction: { x: 0, z: 0 } // For distributed loads
});

// Model validation
export const validateModel = (model) => {
    const errors = [];
    
    if (!model.id) {
        errors.push('Model must have an ID');
    }
    
    if (!model.version) {
        errors.push('Model must have a version');
    }
    
    if (!Array.isArray(model.nodes)) {
        errors.push('Model must have a nodes array');
    }
    
    if (!Array.isArray(model.beams)) {
        errors.push('Model must have a beams array');
    }
    
    // Validate each node
    model.nodes.forEach((node, index) => {
        const nodeErrors = validateNode(node);
        if (nodeErrors.length > 0) {
            errors.push(`Node ${index}: ${nodeErrors.join(', ')}`);
        }
    });
    
    // Validate each beam (future)
    model.beams.forEach((beam, index) => {
        const beamErrors = validateBeam(beam, model.nodes);
        if (beamErrors.length > 0) {
            errors.push(`Beam ${index}: ${beamErrors.join(', ')}`);
        }
    });
    
    return errors;
};

// Node validation
export const validateNode = (node) => {
    const errors = [];
    
    if (!node.id) {
        errors.push('Node must have an ID');
    }
    
    if (!node.coordinates || typeof node.coordinates.x !== 'number' || typeof node.coordinates.z !== 'number') {
        errors.push('Node must have valid coordinates');
    }
    
    if (!node.constraints || 
        typeof node.constraints.x !== 'boolean' ||
        typeof node.constraints.z !== 'boolean' ||
        typeof node.constraints.r !== 'boolean') {
        errors.push('Node must have valid constraints');
    }
    
    if (!node.loads ||
        typeof node.loads.fx !== 'number' ||
        typeof node.loads.fz !== 'number' ||
        typeof node.loads.m !== 'number') {
        errors.push('Node must have valid loads');
    }
    
    return errors;
};

// Beam validation (future)
export const validateBeam = (beam, nodes) => {
    const errors = [];
    
    if (!beam.id) {
        errors.push('Beam must have an ID');
    }
    
    if (!beam.startNode || !beam.endNode) {
        errors.push('Beam must have start and end nodes');
    }
    
    if (beam.startNode === beam.endNode) {
        errors.push('Beam start and end nodes cannot be the same');
    }
    
    // Check if referenced nodes exist
    const startNodeExists = nodes.some(node => node.id === beam.startNode);
    const endNodeExists = nodes.some(node => node.id === beam.endNode);
    
    if (!startNodeExists) {
        errors.push('Beam start node does not exist');
    }
    
    if (!endNodeExists) {
        errors.push('Beam end node does not exist');
    }
    
    return errors;
};

// Model manipulation functions
export const addNodeToModel = (model, coordinates) => {
    const newNode = createNode(coordinates);
    return {
        ...model,
        nodes: [...model.nodes, newNode]
    };
};

export const updateNodeInModel = (model, nodeId, properties) => {
    // Validate properties before updating
    const validationErrors = validateNodeProperties(properties);
    if (validationErrors.length > 0) {
        throw new Error(`Invalid node properties: ${validationErrors.join(', ')}`);
    }
    
    return {
        ...model,
        nodes: model.nodes.map(node => 
            node.id === nodeId 
                ? { ...node, ...properties }
                : node
        )
    };
};

export const removeNodeFromModel = (model, nodeId) => {
    // Remove node and any beams connected to it
    return {
        ...model,
        nodes: model.nodes.filter(node => node.id !== nodeId),
        beams: model.beams.filter(beam => 
            beam.startNode !== nodeId && beam.endNode !== nodeId
        )
    };
};

export const addBeamToModel = (model, startNodeId, endNodeId) => {
    const newBeam = createBeam(startNodeId, endNodeId);
    
    // Validate beam before adding
    const beamErrors = validateBeam(newBeam, model.nodes);
    if (beamErrors.length > 0) {
        throw new Error(`Invalid beam: ${beamErrors.join(', ')}`);
    }
    
    return {
        ...model,
        beams: [...model.beams, newBeam]
    };
};

export const updateBeamInModel = (model, beamId, properties) => {
    return {
        ...model,
        beams: model.beams.map(beam => 
            beam.id === beamId 
                ? { ...beam, ...properties }
                : beam
        )
    };
};

export const removeBeamFromModel = (model, beamId) => {
    return {
        ...model,
        beams: model.beams.filter(beam => beam.id !== beamId)
    };
};

// Model bounds calculation
export const calculateModelBounds = (model) => {
    if (model.nodes.length === 0) {
        return {
            minX: 0, maxX: 0,
            minZ: 0, maxZ: 0,
            centerX: 0, centerZ: 0,
            width: 0, height: 0
        };
    }
    
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
    
    return {
        ...bounds,
        centerX: (bounds.minX + bounds.maxX) / 2,
        centerZ: (bounds.minZ + bounds.maxZ) / 2,
        width: bounds.maxX - bounds.minX,
        height: bounds.maxZ - bounds.minZ
    };
};

// Model serialization for JBeam compatibility
export const serializeModel = (model) => {
    // Ensure JBeam compatibility
    return {
        version: model.version || "1.0",
        modelType: model.modelType || "structural",
        name: model.name || `Model ${model.id}`,
        nodes: model.nodes.map(node => ({
            id: node.id,
            label: node.label || "",
            coordinates: {
                x: node.coordinates.x,
                z: node.coordinates.z
            },
            constraints: {
                x: node.constraints.x,
                z: node.constraints.z,
                r: node.constraints.r
            },
            loads: {
                fx: node.loads.fx,
                fz: node.loads.fz,
                m: node.loads.m
            }
        })),
        beams: model.beams.map(beam => ({
            id: beam.id,
            label: beam.label || "",
            startNode: beam.startNode,
            endNode: beam.endNode,
            properties: beam.properties || {}
        })),
        loads: model.loads || [],
        constraints: model.constraints || [],
        results: model.results || null
    };
};

// Model deserialization
export const deserializeModel = (data) => {
    try {
        // Ensure all required fields exist
        const model = {
            id: data.id || `${Date.now()}`,
            version: data.version || "1.0",
            modelType: data.modelType || "structural",
            name: data.name || `Model ${data.id || Date.now()}`,
            nodes: data.nodes || [],
            beams: data.beams || [],
            loads: data.loads || [],
            constraints: data.constraints || [],
            results: data.results || null
        };
        
        // Validate the model
        const errors = validateModel(model);
        if (errors.length > 0) {
            throw new Error(`Model validation failed: ${errors.join(', ')}`);
        }
        
        return model;
    } catch (error) {
        console.error('Failed to deserialize model:', error);
        throw error;
    }
};

// Model statistics
export const getModelStatistics = (model) => {
    return {
        nodeCount: model.nodes.length,
        beamCount: model.beams.length,
        loadCount: model.loads ? model.loads.length : 0,
        constraintCount: model.nodes.reduce((count, node) => {
            return count + 
                (node.constraints.x ? 1 : 0) +
                (node.constraints.z ? 1 : 0) +
                (node.constraints.r ? 1 : 0);
        }, 0),
        appliedLoads: model.nodes.reduce((count, node) => {
            return count +
                (Math.abs(node.loads.fx) > 0.001 ? 1 : 0) +
                (Math.abs(node.loads.fz) > 0.001 ? 1 : 0) +
                (Math.abs(node.loads.m) > 0.001 ? 1 : 0);
        }, 0)
    };
};