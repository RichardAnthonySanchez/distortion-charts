module.exports = function (eleventyConfig) {
    // Passthrough copy for assets
    eleventyConfig.addPassthroughCopy("public/styles");
    eleventyConfig.addPassthroughCopy("public/scripts");
    eleventyConfig.addPassthroughCopy("public/markdown/*.png"); // If images are there

    return {
        dir: {
            input: ".",
            includes: "_includes",
            output: "dist"
        },
        // Set markdown template engine to nunjucks so we can use shortcodes/variables if needed
        markdownTemplateEngine: "njk",
        htmlTemplateEngine: "njk",
    };
};
