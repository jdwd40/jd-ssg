// index.jsx

// Define the metadata and components needed for this page
const metadata = {
    title: "Home Page",
    components: [
      "/js/site-header.js"
    ]
  };
  
  // Main JSX component
  export default function Home() {
    return `
      <div>
        <site-header></site-header>
        <h1>Welcome to My Site</h1>
        <p>This is the home page generated using JSX and custom Web Components.</p>
      </div>
    `;
  }
  
  // Export metadata
  export { metadata };
  