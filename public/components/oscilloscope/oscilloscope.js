/* =======================
   OSCILLOSCOPE COMPONENT
   ======================= */

export const createOscilloscope = ({
    svgId,
    driveId,
    driveValId
}) => {
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(`#${svgId}`)
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
        .domain([0, 4 * Math.PI])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([-1.5, 1.5]) // Match the original range
        .range([height, 0]);

    // Grid groups
    const gridX = svg.append("g").attr("class", "grid").attr("transform", `translate(0,${height})`);
    const gridY = svg.append("g").attr("class", "grid");

    // Axes groups
    const axisX = svg.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`);
    const axisY = svg.append("g").attr("class", "axis");

    // Create paths
    const cleanPath = svg.append('path')
        .attr('class', 'ref-line') // Use ref-line style for the clean wave
        .style('stroke-opacity', 0.4);

    const clippedPath = svg.append('path')
        .attr('class', 'data-line');

    /* Logic Utilities */
    function generateWaveData(drive) {
        const points = 500;
        const data = [];
        for (let i = 0; i <= points; i++) {
            const x = (i / points) * 4 * Math.PI;
            const cleanY = Math.sin(x);
            // Apply drive and hard clipping
            const drivenY = cleanY * drive;
            const clippedY = Math.max(-1, Math.min(1, drivenY));
            data.push({ x, cleanY, clippedY });
        }
        return data;
    }

    const lineGeneratorClean = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.cleanY));

    const lineGeneratorClipped = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.clippedY));

    const render = () => {
        const drive = +document.getElementById(driveId).value;
        document.getElementById(driveValId).textContent = drive.toFixed(1);

        const data = generateWaveData(drive);

        // Update Grids
        gridX.call(d3.axisBottom(xScale).ticks(8).tickSize(-height).tickFormat(""));
        gridY.call(d3.axisLeft(yScale).ticks(8).tickSize(-width).tickFormat(""));

        // Update Axes
        axisX.call(d3.axisBottom(xScale).ticks(5).tickFormat(""));
        axisY.call(d3.axisLeft(yScale).ticks(5));

        // Update Lines
        cleanPath.datum(data).attr("d", lineGeneratorClean);
        clippedPath.datum(data).attr("d", lineGeneratorClipped);
    };

    document.getElementById(driveId).addEventListener("input", render);
    render();
};
