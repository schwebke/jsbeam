# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JSBeam is a plane frame and truss calculation web application that runs entirely in the browser. It's a client-only application with no build process, using modern ES modules and import maps.

**JBeam Compatibility**: JSBeam uses the same model file format and algorithms as JBeam (Java-based twin application) to ensure full compatibility and data interchange between platforms.

## Architecture

- **No-build workflow**: Uses native ES modules with import maps for dependencies
- **Frontend**: Built with Preact and HTM (Hyperscript Tagged Markup)
- **Dependencies**: Loaded via ESM CDN (esm.sh)
- **Entry point**: `static/index.html` loads the main application
- **Theming**: CSS custom properties for light/dark mode switching
- **Model Format**: JBeam JSON schema for structural models (stored in `doc/jbeam-model-schema.json`)
- **Coordinate System**: x-z coordinate system matching structural analysis conventions

## Key Technologies

- **Preact**: Lightweight React alternative
- **HTM**: JSX-like syntax without compilation
- **ES Modules**: Native browser module system
- **Import Maps**: Dependency resolution via CDN

## Development

Since this is a no-build project, development is straightforward:

1. Serve the `static/` directory with any HTTP server
2. Use `docker-run.sh` for containerized development
3. Modify files in `static/` directory directly

## File Structure

- `static/index.html` - Main HTML entry point
- `static/main.js` - Application components (MenuBar, ContentArea, StatusBar, etc.)
- `static/styles.css` - CSS with custom properties for theming
- `README.md` - Project documentation with GPL license info
- `docker-run.sh` - Docker development script
- `doc/` - Documentation directory (contains ADRs)
- `doc/jbeam-model-schema.json` - JBeam JSON schema for model validation
- `doc/ADR-001-dark-mode.md` - Dark mode implementation architecture decision (implemented)
- `doc/ADR-002-interactive-node-entry.md` - Interactive node entry and JBeam compatibility (implemented)
- `doc/ADR-003-viewport-pan-zoom.md` - Viewport pan and zoom with extreme zoom capabilities (implemented)

## Current Features

- **Menu System**: File, Mode, View, and Help menus with dropdown functionality
- **Content Area**: Dynamic SVG grid with viewport navigation capabilities
- **Status Bar**: Shows application status with real-time coordinate tracking and zoom level
- **Dark Mode**: Toggle between light and dark themes (? → Dark/Light Mode)
- **Theme Persistence**: Remembers user preference and respects system settings
- **Responsive Design**: Adapts to different screen sizes and aspect ratios
- **Interactive Node Entry**: Click-to-place nodes with JBeam-compatible data structure
- **Application Modes**: Select and addNode modes with extensible architecture
- **Coordinate Tracking**: Real-time x-z coordinate display in status bar
- **Model Management**: JBeam JSON format for cross-platform compatibility
- **URL-based Model State**: Model ID stored in URL for persistence and sharing
- **Multi-Instance Support**: Independent models in different browser tabs/windows
- **Keyboard Shortcuts**: Ctrl+1 (Select mode), Ctrl+2 (Add Node mode)
- **Viewport Pan**: Middle mouse drag to navigate large models
- **Viewport Zoom**: Ctrl+wheel zoom around cursor, View menu zoom controls
- **Adaptive Grid**: Grid spacing automatically adjusts based on zoom level
- **Extreme Zoom Range**: 1e-8 to 1e+8 zoom levels for dimensionless structural analysis

## Planned Features

- **Beam Entry**: Connect nodes with structural beam elements
- **Load Application**: Add forces, moments, and distributed loads
- **Support Definition**: Add boundary conditions and constraints
- **Structural Analysis**: Calculate displacements and internal forces
- **Results Visualization**: Display deformed shapes and force diagrams

## License

GPL v3 - See COPYING file for full license text.