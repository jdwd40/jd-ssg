// static/js/site-header.js
class SiteHeader extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = `
        <style>
          header {
            background-color: #333;
            color: white;
            padding: 10px;
            text-align: center;
          }
          nav a {
            color: white;
            margin: 0 10px;
            text-decoration: none;
          }
        </style>
        <header>
          <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
          </nav>
        </header>
      `;
    }
  }
  
  // Register the web component
  customElements.define('site-header', SiteHeader);
  