/* =======================
   ALIASING CHART COMPONENT
   ======================= */

export const createAliasingChart = ({
    svgId,
    sampleId,
    sampleValId
}) => {
    const margin = { top: 40, right: 40, bottom: 80, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(`#${svgId}`)
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().domain([0, 4 * Math.PI]).range([0, width]);
    const yScale = d3.scaleLinear().domain([-1.2, 1.2]).range([height, 0]);

    // Grid lines
    const gridLines = [-1, -0.5, 0, 0.5, 1];
    gridLines.forEach(y => {
        svg.append('line')
            .attr('class', 'aliasing-grid-line')
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', yScale(y))
            .attr('y2', yScale(y));
    });

    // Center axis
    svg.append('line')
        .attr('class', 'aliasing-axis-line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yScale(0))
        .attr('y2', yScale(0));

    // Axis labels
    svg.append('text')
        .attr('class', 'aliasing-axis-label')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('text-anchor', 'middle')
        .text('Time');

    svg.append('text')
        .attr('class', 'aliasing-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -40)
        .attr('text-anchor', 'middle')
        .text('Amplitude');

    /* Logic Utilities */
    function generateContinuousWave() {
        const points = 500;
        const data = [];
        for (let i = 0; i <= points; i++) {
            const x = (i / points) * 4 * Math.PI;
            const y = Math.sin(x);
            data.push({ x, y });
        }
        return data;
    }

    function generateSampledData(numSamples) {
        const data = [];
        for (let i = 0; i <= numSamples; i++) {
            const x = (i / numSamples) * 4 * Math.PI;
            const y = Math.sin(x);
            data.push({ x, y });
        }
        return data;
    }

    const lineGenerator = d3.line()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y))
        .curve(d3.curveLinear);

    // Draw continuous wave (reference)
    const continuousData = generateContinuousWave();
    svg.append('path')
        .datum(continuousData)
        .attr('class', 'aliasing-wave-path aliasing-continuous-wave')
        .attr('d', lineGenerator);

    // Sampled wave path
    const aliasingPath = svg.append('path')
        .attr('class', 'aliasing-wave-path aliasing-sampled-wave');

    // Groups for reactive elements
    const linesGroup = svg.append('g');
    const pointsGroup = svg.append('g');

    // Static Labels
    svg.append('text')
        .attr('class', 'aliasing-wave-label')
        .attr('x', 10)
        .attr('y', 20)
        .text('Ideal Signal');

    svg.append('text')
        .attr('class', 'aliasing-wave-label')
        .attr('x', 10)
        .attr('y', height - 10)
        .text('Sampled Signal');

    const render = () => {
        const numSamples = +document.getElementById(sampleId).value;
        document.getElementById(sampleValId).textContent = numSamples;

        const sampledData = generateSampledData(numSamples);

        // Update path
        aliasingPath.datum(sampledData).attr('d', lineGenerator);

        // Update vertical lines
        const lines = linesGroup.selectAll('.aliasing-sample-line').data(sampledData);
        lines.enter()
            .append('line')
            .attr('class', 'aliasing-sample-line')
            .merge(lines)
            .attr('x1', d => xScale(d.x))
            .attr('x2', d => xScale(d.x))
            .attr('y1', yScale(0))
            .attr('y2', d => yScale(d.y));
        lines.exit().remove();

        // Update dots
        const points = pointsGroup.selectAll('.aliasing-sample-point').data(sampledData);
        points.enter()
            .append('circle')
            .attr('class', 'aliasing-sample-point')
            .attr('r', 4)
            .merge(points)
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y));
        points.exit().remove();
    };

    document.getElementById(sampleId).addEventListener("input", render);
    render();
};
