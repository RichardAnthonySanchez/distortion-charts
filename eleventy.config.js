module.exports = function (eleventyConfig) {
    // Passthrough copy for assets
    eleventyConfig.addPassthroughCopy("public/styles");
    eleventyConfig.addPassthroughCopy("public/scripts");
    eleventyConfig.addPassthroughCopy("public/img");
    eleventyConfig.addPassthroughCopy("public/markdown/*.png"); // If images are there

    eleventyConfig.addFilter("readableDate", (dateObj) => {
        if (!dateObj) return "";
        const date = new Date(dateObj);
        return date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC" // Force UTC to avoid timezone shift issues from frontmatter dates
        });
    });

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
