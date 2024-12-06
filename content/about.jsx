// about.jsx

// Define the metadata and components needed for this page
const metadata = {
    title: "About Us",
    components: [
      "/js/site-header.js"
    ]
  };
  
  // Main JSX component for About page
  export default function About() {
    return `
      <div>
        <site-header></site-header>
        <h1>About Us</h1>
        <p>Learn more about us on this page.</p>
      </div>
    `;
  }
  
  // Export metadata
  export { metadata };
  