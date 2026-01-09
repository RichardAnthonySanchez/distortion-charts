# Distortion Charts: Static vs LUT Performance Comparison

This project explores the performance characteristics of different digital distortion implementations, specifically comparing Table-based Lookups (LUT) with direct mathematical computation (tanh).

## Contributing

We welcome contributions! If you have insights, data, or improvements to the analysis, here is how you can contribute:

### How to Contribute
1.  **Edit the Content**: All the article's content is located in the markdown file: `public/markdown/tanh_vs_lut_distortions.md`.
2.  **Submit Changes**:
    *   **Via GitHub**: You can edit the file directly on GitHub and submit a pull request.
    *   **Local Development**: 
        *   Clone the repository: `git clone https://github.com/RichardAnthonySanchez/distortion-charts.git`
        *   Make your changes in the markdown file.
        *   Create a Pull Request (PR).

### Review Process
Once a PR is submitted, I will personally test the changes. If the contribution adds value to the research and maintains the project's quality, I will publish it to the live site.

## Local Development

If you'd like to run the project locally to see your changes:

### Prerequisites
- Node.js installed on your system.

### Setup
1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Start development server**:
    ```bash
    npm start
    ```
    This will start an Eleventy server, usually accessible at `http://localhost:8080`.

3.  **Build the project**:
    ```bash
    npm run build
    ```
    The static site will be generated in the `dist/` directory.

---
*Maintained by Richard 'Tony' Sanchez*
