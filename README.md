JSBeam - Plane Frame and Truss Calculation Web Application
==========================================================

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

## Current State
JSBeam is currently in early development with basic application structure in place. The foundation includes:
- Menu bar with File and help menus
- Content area with point grid visualization
- Status bar
- Light/dark theme switching
- Responsive layout that adapts to screen size

## Development
To run JSBeam locally:
1. Serve the `static/` directory with any HTTP server
2. Or use the provided `docker-run.sh` script for containerized development
3. Open in a modern browser that supports ES modules and import maps
