/* =======================
   CHART LOGIC
======================= */

const createChart = ({
    svgId,
    driveId,
    sampleId,
    driveValId,
    sampleValId,
    type = 'discrete' // 'discrete' or 'index'
}) => {
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(`#${svgId}`)
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().range([0, width]);
    const yScale = d3.scaleLinear().domain([-1, 1]).range([height, 0]);

    // Grid groups
    const gridX = svg.append("g").attr("class", "grid").attr("transform", `translate(0,${height})`);
    const gridY = svg.append("g").attr("class", "grid");

    // Axes groups
    const axisX = svg.append("g").attr("class", "axis").attr("transform", `translate(0,${height})`);
    const axisY = svg.append("g").attr("class", "axis");

    // Reference Line
    const refLine = svg.append("line").attr("class", "ref-line");

    /* Logic Utilities */
    const tblsz = 1024;
    const tbl = new Float32Array(tblsz);
    for (let i = 0; i < tblsz; i++) {
        const x = (i / (tblsz - 1)) * 2 - 1;
        const ex = Math.exp(6 * x);
        tbl[i] = (ex - 1) / (ex + 1);
    }

    const applyDistortion = (input, drive) => {
        if (drive === 0) return input;
        let x = input * drive;
        x = Math.max(-1, Math.min(1, x));
        const idx = (x + 1) * 0.5 * (tblsz - 1);
        const i = Math.floor(idx);
        const f = idx - i;
        if (i >= tblsz - 1) return tbl[tblsz - 1];
        return tbl[i] + f * (tbl[i + 1] - tbl[i]);
    };

    const staticWaveshape = (x, drive) => {
        if (drive === 0) return x;
        let driven = x * drive;
        driven = Math.max(-1, Math.min(1, driven));
        const ex = Math.exp(2 * driven * 3);
        return (ex - 1) / (ex + 1);
    };

    const generateData = (drive, count) => {
        const data = [];
        for (let i = 0; i < count; i++) {
            let input, output;
            if (type === 'discrete') {
                const t = (i / (count - 1)) * 2 - 1;
                input = Math.tanh(1.5 * t);
                output = applyDistortion(input, drive);
            } else {
                input = (i / (count - 1)) * 2 - 1;
                output = staticWaveshape(input, drive);
            }
            data.push({ i, x: input, y: output });
        }
        return data;
    };

    const lineGenerator = d3.line()
        .x(d => type === 'discrete' ? xScale(d.x) : xScale(d.i))
        .y(d => yScale(d.y));

    const path = svg.append("path").attr("class", "data-line");

    const render = () => {
        const drive = +document.getElementById(driveId).value;
        const count = +document.getElementById(sampleId).value;

        document.getElementById(driveValId).textContent = drive.toFixed(1);
        document.getElementById(sampleValId).textContent = count;

        const data = generateData(drive, count);

        // Update Scales
        if (type === 'discrete') {
            xScale.domain([-1, 1]);
        } else {
            xScale.domain([0, count - 1]);
        }

        // Update Grids
        gridX.call(d3.axisBottom(xScale).ticks(8).tickSize(-height).tickFormat(""));
        gridY.call(d3.axisLeft(yScale).ticks(8).tickSize(-width).tickFormat(""));

        // Update Axes
        if (type === 'discrete') {
            axisX.call(d3.axisBottom(xScale).ticks(5));
        } else {
            axisX.call(d3.axisBottom(xScale).ticks(5).tickFormat(i => (((i / (count - 1)) * 2 - 1)).toFixed(2)));
        }
        axisY.call(d3.axisLeft(yScale).ticks(5));

        // Update Reference Line
        if (type === 'discrete') {
            refLine.attr("x1", xScale(-1)).attr("y1", yScale(-1)).attr("x2", xScale(1)).attr("y2", yScale(1));
        } else {
            refLine.attr("x1", xScale(0)).attr("y1", yScale(-1)).attr("x2", xScale(count - 1)).attr("y2", yScale(1));
        }

        // Update Line
        path.datum(data).attr("d", lineGenerator);

        // Update Dots
        const dots = svg.selectAll(".data-dot").data(data);
        dots.enter()
            .append("circle")
            .attr("class", "data-dot")
            .attr("r", type === 'discrete' ? 4 : 2)
            .merge(dots)
            .attr("cx", d => type === 'discrete' ? xScale(d.x) : xScale(d.i))
            .attr("cy", d => yScale(d.y));
        dots.exit().remove();
    };

    document.getElementById(driveId).addEventListener("input", render);
    document.getElementById(sampleId).addEventListener("input", render);

    render();
};

const createOscilloscope = ({
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

const createAliasingChart = ({
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


document.addEventListener('DOMContentLoaded', () => {
    // Initialize Oscilloscope
    createOscilloscope({
        svgId: 'oscilloscope-chart',
        driveId: 'driveSlider',
        driveValId: 'driveValue'
    });

    // Initialize Aliasing Chart
    createAliasingChart({
        svgId: 'aliasingChart',
        sampleId: 'aliasingSampleSlider',
        sampleValId: 'aliasingSampleValue'
    });

    // Initialize Discrete Chart
    createChart({
        svgId: 'chart',
        driveId: 'drive',
        sampleId: 'samples',
        driveValId: 'driveVal',
        sampleValId: 'sampleVal',
        type: 'discrete'
    });

    // Initialize Static Chart
    createChart({
        svgId: 'chartStatic',
        driveId: 'driveStatic',
        sampleId: 'samplesStatic',
        driveValId: 'driveValStatic',
        sampleValId: 'sampleValStatic',
        type: 'index'
    });
});

