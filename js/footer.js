const footerTemplate = document.createElement('template');

footerTemplate.innerHTML = `
<div class="mx-auto center container mt-5 mb-5 text-center">
<a href="./index.html" class="nav-btn btn" role="button">Home</a>
<a href="./About.html" class="nav-btn btn" role="button">About</a>
<a href="./Portfolio.html" class="nav-btn btn" role="button">Portfolio</a>
</div>
<div class="mx-auto center container mt-5 text-center">
<a class="svg-link" href="mailto:pipturner@outlook.com">
  <object type="image/svg+xml" data="icons/email.svg" class="footer-icon"></object>
</a>
<a class="svg-link" href="https://github.com/dwarph">
  <object type="image/svg+xml" data="icons/github.svg" class="footer-icon"></object>
</a>
<a class="svg-link" href="https://twitter.com/dwarph">
  <object type="image/svg+xml" data="icons/twitter.svg" class="footer-icon"></object>
</a>
</div>
`;

document.body.appendChild(footerTemplate.content);