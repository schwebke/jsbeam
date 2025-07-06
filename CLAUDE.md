# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JSBeam is a plane frame and truss calculation web application that runs entirely in the browser. It's a client-only application with no build process, using modern ES modules and import maps.

## Architecture

- **No-build workflow**: Uses native ES modules with import maps for dependencies
- **Frontend**: Built with Preact and HTM (Hyperscript Tagged Markup)
- **Dependencies**: Loaded via ESM CDN (esm.sh)
- **Entry point**: `static/index.html` contains the entire application

## Key Technologies

- **Preact**: Lightweight React alternative
- **HTM**: JSX-like syntax without compilation
- **ES Modules**: Native browser module system
- **Import Maps**: Dependency resolution via CDN

## Development

Since this is a no-build project, development is straightforward:

1. Serve the `static/` directory with any HTTP server
2. Use `docker-run.sh` for containerized development
3. All code is in `static/index.html` - modify directly

## File Structure

- `static/index.html` - Main application file containing all code
- `README.md` - Project documentation with GPL license info
- `docker-run.sh` - Docker development script
- `doc/` - Documentation directory (currently empty)

## License

GPL v3 - See COPYING file for full license text.