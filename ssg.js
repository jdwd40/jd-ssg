const fs = require('fs-extra');
const path = require('path');
const swc = require('@swc/core');
const handlebars = require('handlebars');
const { marked } = require('marked');

// Directory paths
const contentDir = path.join(__dirname, 'content');
const outputDir = path.join(__dirname, 'build');
const templateDir = path.join(__dirname, 'templates');

// Load Handlebars template
async function loadTemplate() {
    const templateContent = await fs.readFile(path.join(templateDir, 'layout.hbs'), 'utf-8');
    return handlebars.compile(templateContent);
}

// Compile JSX to JS using SWC
async function compileJSX(filePath) {
    const jsxContent = await fs.readFile(filePath, 'utf-8');
    
    // Transpile JSX to JavaScript
    const { code: compiledJS } = await swc.transform(jsxContent, {
        jsc: {
            parser: {
                syntax: 'ecmascript',
                jsx: true
            }
        },
        module: {
            type: 'commonjs'  // For Node.js compatibility
        }
    });

    // Write the transpiled JS to a temporary file
    const jsFilePath = filePath.replace('.jsx', '.js');
    await fs.outputFile(jsFilePath, compiledJS);
    return jsFilePath;
}

// Normalize filenames by converting to lowercase and removing spaces
function normalizeFilename(filename) {
    return filename.toLowerCase().replace(/\s+/g, '');
}

// Generate Navbar HTML
function generateNavbar(folders) {
    let navbar = '<nav class="navbar"><ul class="navbar-links">';
    folders.forEach(folder => {
        const normalizedFolder = normalizeFilename(folder);
        navbar += `<li class="navbar-item"><a href="/${normalizedFolder}/index.html">${normalizedFolder}</a></li>`;
    });
    navbar += '</ul></nav>';
    return navbar;
}

// Recursively process files in the content directory
async function processFiles(template, dir = contentDir, folders = []) {
    const files = await fs.readdir(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);

        if (stat.isDirectory()) {
            folders.push(file);
            await processFiles(template, filePath, folders);
        } else if (file.endsWith('.jsx')) {
            const jsFilePath = await compileJSX(filePath);
            const { default: Component, metadata } = require(jsFilePath);
            const renderedContent = Component();
            const componentScripts = metadata.components ? metadata.components.map(src => `<script src="${src}" defer></script>`).join('\n') : '';
            const finalHtml = template({
                title: metadata.title || 'Untitled',
                content: renderedContent,
                componentScripts,
                navbar: generateNavbar(folders)
            });
            const relativePath = path.relative(contentDir, filePath);
            const normalizedPath = normalizeFilename(relativePath.replace('.jsx', '.html'));
            await fs.outputFile(path.join(outputDir, normalizedPath), finalHtml);
            console.log(`Generated: ${normalizedPath}`);
            await fs.remove(jsFilePath);
        } else if (file.endsWith('.md')) {
            const markdownContent = await fs.readFile(filePath, 'utf-8');
            const renderedContent = marked(markdownContent);
            const finalHtml = template({
                title: 'Untitled',
                content: renderedContent,
                componentScripts: '',
                navbar: generateNavbar(folders)
            });
            const relativePath = path.relative(contentDir, filePath);
            const normalizedPath = normalizeFilename(relativePath.replace('.md', '.html'));
            await fs.outputFile(path.join(outputDir, normalizedPath), finalHtml);
            console.log(`Generated: ${normalizedPath}`);
        }
    }
}

// Generate Index Page
async function generateIndexPage(template, folders) {
    const content = '<h1>Welcome to the Home Page</h1><p>This is the home page generated using JSX and custom Web Components.</p>';
    const finalHtml = template({
        title: 'Home Page',
        content,
        componentScripts: '',
        navbar: generateNavbar(folders)
    });
    await fs.outputFile(path.join(outputDir, 'index.html'), finalHtml);
    console.log('Generated: index.html');
}

// Generate Folder Pages
async function generateFolderPages(template, folders) {
    for (const folder of folders) {
        const folderPath = path.join(contentDir, folder);
        const files = await fs.readdir(folderPath);
        let content = `<h1>${folder}</h1><ul>`;
        files.forEach(file => {
            const fileName = normalizeFilename(file.replace('.md', '.html').replace('.jsx', '.html'));
            const normalizedFolder = normalizeFilename(folder);
            content += `<li><a href="/${normalizedFolder}/${fileName}">${fileName}</a></li>`;
        });
        content += '</ul>';
        const finalHtml = template({
            title: folder,
            content,
            componentScripts: '',
            navbar: generateNavbar(folders)
        });
        const normalizedFolder = normalizeFilename(folder);
        await fs.outputFile(path.join(outputDir, normalizedFolder, 'index.html'), finalHtml);
        console.log(`Generated: ${normalizedFolder}/index.html`);
    }
}

// Copy static assets (CSS, images, JS, etc.) to the build folder
async function copyStaticAssets() {
    const staticDir = path.join(__dirname, 'static');
    await fs.copy(staticDir, outputDir);
    console.log("Static assets copied to build folder.");
}

// Main function to build the site
async function buildSite() {
    await fs.ensureDir(outputDir);
    const template = await loadTemplate();
    const folders = [];
    await processFiles(template, contentDir, folders);
    await generateIndexPage(template, folders);
    await generateFolderPages(template, folders);
    await copyStaticAssets();
}

// Execute the build process
buildSite().catch(err => console.error(err));