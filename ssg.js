const fs = require('fs-extra');
const path = require('path');
const markdownIt = require('markdown-it');
const handlebars = require('handlebars');
const matter = require('gray-matter');  // For front matter support

const contentDir = path.join(__dirname, 'content');
const templateDir = path.join(__dirname, 'templates');
const outputDir = path.join(__dirname, 'build');
const staticDir = path.join(__dirname, 'static');  // Static assets folder

// Initialize markdown-it
const md = new markdownIt();

// Load Handlebars template
async function loadTemplate() {
    const templateContent = await fs.readFile(path.join(templateDir, 'layout.hbs'), 'utf-8');
    return handlebars.compile(templateContent);
}

// Process markdown files
async function processMarkdownFiles(template) {
    const files = await fs.readdir(contentDir);

    for (const file of files) {
        if (file.endsWith('.md')) {
            const fileContent = await fs.readFile(path.join(contentDir, file), 'utf-8');

            // Extract front matter (metadata) and content
            const { data, content } = matter(fileContent);

            // Convert markdown to HTML
            const htmlContent = md.render(content);

            // Apply the template with content and metadata
            const finalHtml = template({ content: htmlContent, ...data });

            // Write the final HTML file to the output directory
            const outputFileName = file.replace('.md', '.html');
            await fs.outputFile(path.join(outputDir, outputFileName), finalHtml);

            console.log(`Generated: ${outputFileName}`);
        }
    }
}

// Copy static assets (CSS, images, JS, etc.) to the build folder
async function copyStaticAssets() {
    await fs.copy(staticDir, outputDir);  // Copies all files in static/ to build/
    console.log("Static assets copied to build folder.");
}

// Main function to build the site
async function buildSite() {
    await fs.ensureDir(outputDir);  // Ensure the build directory exists

    const template = await loadTemplate();  // Load the Handlebars template
    await processMarkdownFiles(template);   // Process markdown files
    await copyStaticAssets();               // Copy static assets like CSS
}

// Execute the build process
buildSite().catch((err) => console.error(err));
