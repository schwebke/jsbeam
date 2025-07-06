JSBeam - Plane Frame and Truss Calculation Web Application
==========================================================

**JBeam Compatibility**: JSBeam uses the same model file format and algorithms as JBeam (Java-based desktop application) to ensure full compatibility and data interchange between platforms.

Copyright (C) 2025 Kai Gerd Schwebke

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.


## Features
- Client-only web application for modern browsers
- No-build workflow using native ES modules
- Built with Preact and HTM (Hyperscript Tagged Markup)
- Responsive design with dynamic SVG grid
- Dark mode support with system preference detection
- Menu system with dropdown functionality
- Theme persistence using localStorage
- **JBeam JSON format compatibility** for cross-platform model sharing
- **x-z coordinate system** matching structural analysis conventions

## Current State
JSBeam has implemented the core interactive modeling features:
- Menu bar with File and help menus
- Content area with point grid visualization and node placement
- Status bar with real-time coordinate tracking
- Light/dark theme switching
- Responsive layout that adapts to screen size
- **Interactive node entry** with click-to-place functionality
- **Application modes** (select, addNode) with extensible architecture
- **Real-time coordinate tracking** in x-z coordinate system
- **JBeam-compatible model structure** for structural analysis
- **URL-based model management** for persistence and sharing
- **Multi-instance support** for independent models in different browser tabs
- **Keyboard shortcuts** for mode switching (Ctrl+1, Ctrl+2)

## Planned Features
The next development phase will focus on:
- **Beam entry** to connect nodes with structural elements
- **Load application** for forces, moments, and distributed loads
- **Support definition** for boundary conditions and constraints
- **Structural analysis** calculations using JBeam-compatible algorithms
- **Results visualization** with deformed shapes and force diagrams

## Development
To run JSBeam locally:
1. Serve the `static/` directory with any HTTP server
2. Or use the provided `docker-run.sh` script for containerized development
3. Open in a modern browser that supports ES modules and import maps

## Documentation
- `doc/ADR-001-dark-mode.md` - Dark mode implementation architecture
- `doc/ADR-002-interactive-node-entry.md` - Interactive node entry and JBeam compatibility
- `doc/jbeam-model-schema.json` - JBeam JSON schema for model validation
