
import { styles } from "../static/styles";
import { script } from "../static/script";

export const getLayout = () => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Via UI — Module Explorer</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        ${styles}
    </style>
</head>
<body>
    <aside>
        <div class="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Via UI
        </div>
        <input type="text" class="search" placeholder="Search modules..." oninput="filterModules(this.value)">
        <div class="module-list" id="module-list">
            <!-- Modules will be populated here -->
        </div>
    </aside>

    <main id="main-content">
        <div class="empty-state">
            <h1>VIA</h1>
            <p>Select a module to explore its details</p>
        </div>
    </main>

    <script>
        ${script}
    </script>
</body>
</html>
    `;
};
