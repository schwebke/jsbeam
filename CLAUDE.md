# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JSBeam is a plane frame and truss calculation web application that runs entirely in the browser. It's a client-only application with no build process, using modern ES modules and import maps.

## Architecture

- **No-build workflow**: Uses native ES modules with import maps for dependencies
- **Frontend**: Built with Preact and HTM (Hyperscript Tagged Markup)
- **Dependencies**: Loaded via ESM CDN (esm.sh)
- **Entry point**: `static/index.html` loads the main application
- **Theming**: CSS custom properties for light/dark mode switching

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

## Current Features

- **Menu System**: File and help menus with dropdown functionality
- **Content Area**: Dynamic SVG grid that adapts to container size
- **Status Bar**: Shows application status
- **Dark Mode**: Toggle between light and dark themes (? → Dark/Light Mode)
- **Theme Persistence**: Remembers user preference and respects system settings
- **Responsive Design**: Adapts to different screen sizes and aspect ratios

## License

GPL v3 - See COPYING file for full license text.