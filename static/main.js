import { html } from 'htm/preact';
import { useState, useEffect } from 'preact/hooks';

// MenuBar component
export function MenuBar({ onAbout, onToggleTheme, currentTheme }) {
    const [showFileMenu, setShowFileMenu] = useState(false);
    const [showHelpMenu, setShowHelpMenu] = useState(false);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.menu-item')) {
                setShowFileMenu(false);
                setShowHelpMenu(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleFileMenuClick = (e) => {
        e.stopPropagation();
        setShowHelpMenu(false);
        setShowFileMenu(!showFileMenu);
    };

    const handleHelpMenuClick = (e) => {
        e.stopPropagation();
        setShowFileMenu(false);
        setShowHelpMenu(!showHelpMenu);
    };

    const handleFileNew = (e) => {
        e.stopPropagation();
        setShowFileMenu(false);
        // File - new does nothing for now
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
export function StatusBar() {
    return html`
        <div class="statusbar">
            Ready
        </div>
    `;
}

// ContentArea component with SVG point grid
export function ContentArea() {
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

    return html`
        <div class="content-area">
            <svg width="100%" height="100%" viewBox="0 0 ${dimensions.width} ${dimensions.height}">
                ${points.map(([x, y]) => html`
                    <circle cx=${x} cy=${y} r="0.5" fill="var(--grid-color)" vector-effect="non-scaling-stroke" />
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

// Main App component
export function App() {
    const [showAbout, setShowAbout] = useState(false);
    const [theme, setTheme] = useState('light');

    // Initialize theme from localStorage and system preference
    useEffect(() => {
        const savedTheme = localStorage.getItem('jsbeam-theme');
        const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const initialTheme = savedTheme || systemPreference;
        setTheme(initialTheme);
        document.documentElement.className = initialTheme === 'dark' ? 'dark-theme' : '';
    }, []);

    // Update theme and persist to localStorage
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('jsbeam-theme', newTheme);
        document.documentElement.className = newTheme === 'dark' ? 'dark-theme' : '';
    };

    return html`
        <div class="app">
            <${MenuBar} onAbout=${() => setShowAbout(true)} onToggleTheme=${toggleTheme} currentTheme=${theme} />
            <${ContentArea} />
            <${StatusBar} />
            <${AboutDialog} isOpen=${showAbout} onClose=${() => setShowAbout(false)} />
        </div>
    `;
}