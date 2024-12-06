// contact.jsx

// Define the metadata and components needed for this page
const metadata = {
    title: "Contact Us",
    components: [
      "/js/site-header.js"
    ]
  };
  
  // Main JSX component for Contact page
  export default function Contact() {
    return `
      <div>
        <site-header></site-header>
        <h1>Contact Us</h1>
        <p>Get in touch with us through this page.</p>
      </div>
    `;
  }
  
  // Export metadata
  export { metadata };
  