const fs = require('fs-extra');
const path = require('path');
const markdownIt = require('markdown-it');
const markdownItContainer = require('markdown-it-container');
const handlebars = require('handlebars');
const matter = require('gray-matter');  // For front matter support

const contentDir = path.join(__dirname, 'content');
const templateDir = path.join(__dirname, 'templates');
const outputDir = path.join(__dirname, 'build');
const staticDir = path.join(__dirname, 'static');

// Initialize markdown-it and add the custom "box" container plugin
const md = markdownIt().use(markdownItContainer, 'box', {
    validate: function(params) {
        return params.trim().match(/^box\s+(.*)$/);
    },
    render: function(tokens, idx) {
        const m = tokens[idx].info.trim().match(/^box\s+(.*)$/);

        if (tokens[idx].nesting === 1) {
            // Parse the custom box options and generate classes
            const options = m[1];
            const attrs = parseBoxOptions(options);

            return `<div class="box ${attrs.boxClass} ${attrs.textSizeClass} ${attrs.textStyleClass}">\n`;
        } else {
            return '</div>\n';
        }
    }
});

// Helper function to parse the options (size, textSize, textStyle) and map them to CSS classes
function parseBoxOptions(options) {
    const attrs = {
        boxClass: '',
        textSizeClass: '',
        textStyleClass: ''
    };

    // Match the size, textSize, and textStyle attributes in the command
    const sizeMatch = options.match(/size="(.*?)"/);
    const textSizeMatch = options.match(/textSize="(.*?)"/);
    const textStyleMatch = options.match(/textStyle="(.*?)"/);

    if (sizeMatch) {
        const size = sizeMatch[1];
        attrs.boxClass = `box-${size}`;
    }

    if (textSizeMatch) {
        const textSize = textSizeMatch[1];
        attrs.textSizeClass = `text-${textSize}`;
    }

    if (textStyleMatch) {
        const textStyle = textStyleMatch[1];
        attrs.textStyleClass = `text-${textStyle}`;
    }

    return attrs;
}

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

            // Convert markdown to HTML with custom parsing
            const htmlContent = md.render(content);

            // Apply the template with content and metadata
            const finalHtml = template({
                content: htmlContent,
                ...data
            });

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
