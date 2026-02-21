
export const script = `
    let modules = [];
    let selectedModule = null;

    async function fetchModules() {
        try {
            const res = await fetch('/api/modules');
            const data = await res.json();
            modules = data.modules;
            renderModuleList();
        } catch (e) {
            console.error("Failed to fetch modules", e);
        }
    }

    function renderModuleList(filtered = modules) {
        const list = document.getElementById('module-list');
        list.innerHTML = filtered.map(m => {
            const isActive = selectedModule?.id === m.id;
            // Use simple string concatenation to accidental escape issues with backticks/template literals in the transpiled output
            // if this string is injected into another template literal.
            return '<div class="module-item ' + (isActive ? 'active' : '') + '" onclick="selectModule(\\'' + m.id + '\\')">' + m.name + '</div>';
        }).join('');
    }

    function filterModules(query) {
        const filtered = modules.filter(m => m.name.toLowerCase().includes(query.toLowerCase()));
        renderModuleList(filtered);
    }

    function selectModule(id) {
        selectedModule = modules.find(m => m.id === id);
        renderModuleList();
        renderContent();
    }

    function renderContent() {
        if (!selectedModule) return;

        const main = document.getElementById('main-content');
        const allFiles = flattenDeps(selectedModule.deps || {});
        
        let html = '<div class="module-header"><div class="module-title">' + selectedModule.name + '<span class="badge">Module</span></div><p style="color: var(--text-secondary)">ID: ' + selectedModule.id + '</p></div>';
        
        html += '<div class="stats-grid">';
        html += '<div class="stat-card"><div class="stat-label">Total Files</div><div class="stat-value">' + allFiles.length + '</div></div>';
        html += '<div class="stat-card"><div class="stat-label">Original Name</div><div class="stat-value">' + (selectedModule.originalName || 'N/A') + '</div></div>';
        html += '</div>';

        html += '<div class="file-tree"><div class="tree-header"><span style="font-weight: 600">Module Structure</span></div><div class="tree-body">';
        html += allFiles.map(f => {
            return '<div class="file-item" onclick="showCode(\\'' + f.path + '\\')"><span class="file-icon">📄</span><span>' + f.path + '</span></div>';
        }).join('');
        html += '</div></div>';

        html += '<div id="code-viewer" class="code-container"><div style="display: flex; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 12px;"><span id="filename-label" style="font-family: \\'JetBrains Mono\\', monospace; font-size: 12px; color: var(--accent)"></span><span style="font-size: 10px; color: var(--text-secondary); cursor: pointer;" onclick="hideCode()">Close</span></div><pre><code id="code-content"></code></pre></div>';

        main.innerHTML = html;
    }

    function flattenDeps(node) {
        if (!node || !node.path) return [];
        let files = [{ path: node.path, content: node.content }];
        if (node.dependencies) {
            node.dependencies.forEach(dep => {
                files = [...files, ...flattenDeps(dep)];
            });
        }
        const seen = new Set();
        return files.filter(f => {
            if (seen.has(f.path)) return false;
            seen.add(f.path);
            return true;
        });
    }

    function showCode(path) {
        const allFiles = flattenDeps(selectedModule.deps || {});
        const file = allFiles.find(f => f.path === path);
        if (!file) return;

        const viewer = document.getElementById('code-viewer');
        const label = document.getElementById('filename-label');
        const content = document.getElementById('code-content');

        label.innerText = path;
        content.innerText = file.content || '// No content available';
        viewer.style.display = 'block';
        viewer.scrollIntoView({ behavior: 'smooth' });
    }

    function hideCode() {
        document.getElementById('code-viewer').style.display = 'none';
    }

    fetchModules();
`;
