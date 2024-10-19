const fs = require('fs-extra');
const path = require('path');
const swc = require('@swc/core');
const handlebars = require('handlebars');

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

// Process JSX files
async function processJSXFiles(template) {
    const files = await fs.readdir(contentDir);

    for (const file of files) {
        if (file.endsWith('.jsx')) {
            const filePath = path.join(contentDir, file);

            // Compile the JSX to JavaScript and get the new JS file path
            const jsFilePath = await compileJSX(filePath);

            // Dynamically import the transpiled JS file (standard Node.js)
            const { default: Component, metadata } = require(jsFilePath);

            // Render the JSX component to HTML
            const renderedContent = Component();  // Execute the component to get its content

            // Generate script tags for required components
            let componentScripts = '';
            if (metadata.components) {
                componentScripts = metadata.components.map((src) => `<script src="${src}" defer></script>`).join('\n');
            }

            // Inject compiled JSX and the Web Component scripts into the template
            const finalHtml = template({
                title: metadata.title || 'Untitled',
                content: renderedContent,  // Inject the rendered JSX output
                componentScripts           // Inject Web Component scripts
            });

            // Write the final HTML file to the output directory
            const outputFileName = file.replace('.jsx', '.html');
            await fs.outputFile(path.join(outputDir, outputFileName), finalHtml);

            console.log(`Generated: ${outputFileName}`);

            // Clean up: Optionally remove the transpiled JS file if you don't want to keep it
            await fs.remove(jsFilePath);
        }
    }
}

// Copy static assets (CSS, images, JS, etc.) to the build folder
async function copyStaticAssets() {
    const staticDir = path.join(__dirname, 'static');
    await fs.copy(staticDir, outputDir);  // Copies all files in static/ to build/
    console.log("Static assets copied to build folder.");
}

// Main function to build the site
async function buildSite() {
    await fs.ensureDir(outputDir);  // Ensure the build directory exists

    const template = await loadTemplate();  // Load the Handlebars template
    await processJSXFiles(template);        // Process JSX files and generate HTML
    await copyStaticAssets();               // Copy static assets like CSS and JS
}

// Execute the build process
buildSite().catch((err) => console.error(err));
