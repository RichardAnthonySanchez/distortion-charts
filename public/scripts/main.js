/* =======================
   MAIN INITIALIZATION
   ======================= */

import { createChart } from '../components/charts/chart.js';
import { createOscilloscope } from '../components/oscilloscope/oscilloscope.js';
import { createAliasingChart } from '../components/aliasing/aliasing.js';

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

    // Initialize Discrete Chart (tanh comparison)
    createChart({
        svgId: 'chart',
        driveId: 'drive',
        sampleId: 'samples',
        driveValId: 'driveVal',
        sampleValId: 'sampleVal',
        type: 'discrete'
    });

    // Initialize Static Chart (LUT comparison)
    createChart({
        svgId: 'chartStatic',
        driveId: 'driveStatic',
        sampleId: 'samplesStatic',
        driveValId: 'driveValStatic',
        sampleValId: 'sampleValStatic',
        type: 'index'
    });
});
