
export const styles = `
    :root {
        --bg: #0a0a0c;
        --sidebar-bg: #111114;
        --card-bg: #16161a;
        --accent: #C13C62;
        --accent-gradient: linear-gradient(135deg, #9621A1 0%, #C13C62 50%, #B6353B 100%);
        --text-primary: #ffffff;
        --text-secondary: #94a3b8;
        --border: rgba(255, 255, 255, 0.05);
        --border-hover: rgba(255, 255, 255, 0.1);
    }

    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    body {
        font-family: 'Outfit', sans-serif;
        background-color: var(--bg);
        color: var(--text-primary);
        display: flex;
        height: 100vh;
        overflow: hidden;
    }

    /* Sidebar */
    aside {
        width: 300px;
        background-color: var(--sidebar-bg);
        border-right: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        padding: 24px;
    }

    .logo {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 32px;
        background: var(--accent-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .search {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid var(--border);
        padding: 12px 16px;
        border-radius: 12px;
        color: white;
        margin-bottom: 24px;
        outline: none;
        transition: all 0.2s;
    }

    .search:focus {
        border-color: var(--accent);
        background: rgba(255, 255, 255, 0.05);
    }

    .module-list {
        flex: 1;
        overflow-y: auto;
    }

    .module-item {
        padding: 12px 16px;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: 8px;
        border: 1px solid transparent;
    }

    .module-item:hover {
        background: rgba(255, 255, 255, 0.03);
        border-color: var(--border-hover);
    }

    .module-item.active {
        background: rgba(193, 60, 98, 0.1);
        border-color: rgba(193, 60, 98, 0.2);
        color: var(--accent);
    }

    /* Main Content */
    main {
        flex: 1;
        padding: 40px;
        overflow-y: auto;
        position: relative;
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--text-secondary);
        text-align: center;
    }

    .empty-state h1 {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.1;
    }

    .module-header {
        margin-bottom: 40px;
    }

    .module-title {
        font-size: 32px;
        font-weight: 600;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .badge {
        font-size: 12px;
        padding: 4px 10px;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--border);
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 40px;
    }

    .stat-card {
        background: var(--card-bg);
        padding: 24px;
        border-radius: 16px;
        border: 1px solid var(--border);
    }

    .stat-label {
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 8px;
    }

    .stat-value {
        font-size: 20px;
        font-weight: 600;
    }

    .file-tree {
        background: var(--card-bg);
        border-radius: 16px;
        border: 1px solid var(--border);
        overflow: hidden;
    }

    .tree-header {
        padding: 16px 24px;
        background: rgba(255, 255, 255, 0.02);
        border-bottom: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .tree-body {
        padding: 20px;
    }

    .file-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
    }

    .file-item:hover {
        background: rgba(255, 255, 255, 0.03);
    }

    .file-icon {
        opacity: 0.5;
    }

    .code-container {
        margin-top: 40px;
        background: #011627;
        border-radius: 16px;
        border: 1px solid var(--border);
        padding: 24px;
        overflow: auto;
        max-height: 600px;
        display: none;
    }

    pre {
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        line-height: 1.6;
        color: #d6deeb;
    }

    ::-webkit-scrollbar {
        width: 8px;
    }

    ::-webkit-scrollbar-track {
        background: transparent;
    }

    ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    .highlight-accent { color: var(--accent); }
`;
