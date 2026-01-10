---
layout: base.njk
title: "Static vs LUT Distortion: A Performance Comparison"
subtitle: "Exploring what makes digital distortion fast"
author: "Richard 'Tony' Sanchez"
date: 2026-01-08
readTime: "8 min read"
tag: "DSP Research"
permalink: /index.html
---

Here's a question that seems like it has an obvious answer: 
Which is faster, looking up a value in a table, or computing a complex mathematical function?

If you said "looking it up," you're in good company. That's the intuition that led audio engineers to use lookup tables (LUTs) for decades. After all, memory access should be faster than math, right?
But watch what happens when we actually test this assumption.
## The Start of Digital Distortion

Engineers needed to manage signal behavior. When audio systems overload, things get unpredictable - signals clip in ugly ways, equipment gets damaged, speakers blow out. After trial and error, they arrived at a reasonable solution: controlled clipping.

Clipping was originally developed to contain signal peaks within a system's operating range. Now it has many different uses. Whether that's preserving headroom in a mix or creating the saturated guitar tones, we find clipping everywhere in audio.
But if clipping can be used so differently, what actually is it?
## What Is Clipping?

Clipping, saturation, distortion. There's many different names, but these all do the same fundamental thing: they flatten peaks and create harmonic overtones as a result.

Think of it like this - a peak is the maximum amplitude (loudest point) of a signal. When you apply distortion, you're squashing that peak down, like pressing your palm onto a spike. To see it in action use the drive slider below.

<div class="chart-container">
    <div class="chart-header">
        <h3 class="chart-title">Signal Clipping Visualizer</h3>
        <div class="chart-controls">
            <div class="control-group">
                <div class="control-label">Drive <span class="control-value" id="driveValue">1.0</span></div>
                <input id="driveSlider" type="range" min="1" max="10" step="0.1" value="1">
            </div>
        </div>
    </div>
    <svg id="oscilloscope-chart"></svg>
</div>

*Distortion flattens peaks*

The peak flattens, but something has to give. Overdrive creates new frequencies that weren't there before as a result of that flattening.

We can see this harmonic behavior under and FFT:

<div class="chart-container static">
    <img src="{{ '/public/img/1k_sine_fundamental.svg' | url }}" alt="Fundamental of 1khz sine wave">
</div>

*Here's how a 1khz sine wave looks on FFT*

<div class="chart-container static">
    <img src="{{ '/public/img/1k_sine_overtones.svg' | url }}" alt="Overtones of 1khz sine wave with distortion">
</div>

*The same 1khz sine wave with distortion adds harmonic content*

The same 1kHz sine wave with distortion suddenly has harmonics at 3kHz, 5kHz, 7kHz, 9kHz: a whole series of new frequencies generated from that flattening.
These are the two fingerprints that confirm clipping is happening: the flattened waveform and the harmonic series.
## Implementing Distortion in DSP

Here's where things get interesting. We can think of digital audio as snapshots of sound captured at regular time intervals. These snapshots are called samples.
Much like a movie is a series of still pictures that create the illusion of motion, samples create the illusion of continuous sound when played back in sequence.

Here's how it looks:
 
<div class="chart-container static">
    <img src="{{ '/public/img/sample_and_hold.svg' | url }}" alt="How samples are captured at regular intervals">
</div>

*A series of samples capturing a signal at regular intervals. The effect is dramatic for demonstration purposes.*

Now here's the key: we give position instructionsto each of these samples based on its input amplitude. Want smooth, warm saturation? Use one set of instructions. Want aggressive, fuzzy distortion? Use another. The smoothness of our clipping comes entirely from which set of instructions we choose.

We can confirm processing is happening at each sample: I'm using a script that counts each sample being processed, groups them by second, then measures the results. 

```JSFX
@init
last_time = time_precise(); // Initialize system clock
sample_counter = 0;         // Current running count
samples_last_second = 0;    // This will show our "Results"

@sample
//DSP goes here
current_time = time_precise();
(current_time - last_time >= 1.0) ? (
  samples_last_second = sample_counter; // Snapshot the count
  sample_counter = 0;                   // Reset for next second
  last_time = current_time;             // Update reference time
);
```
Want the source code? Check it out: [https://github.com/RichardAnthonySanchez/static-vs-lut](https://github.com/RichardAnthonySanchez/static-vs-lut)

Here's what the script logs:

<div class="comparison-container">
    <code class="status-warning" style="font-size: 1.5rem;">Session Sample Rate: 44100</code>
    <code class="status-success" style="font-size: 1.5rem;">samples_last_second: 44288</code>
</div>

*This session is set to 44.1khz sample rate and the logs confirm each sample is processed by our distortion implementation.*
## The Cost of Processing

Think about what this means. In CD-quality audio, there are 44,100 samples happening every second. If our processing runs at CD-quality, we're applying our instructions 44,100 times per second. Every second. Continuously.

The more steps in our instructions, the more taxing this becomes on our system. Computing something like tanh() involves exponential calculations: it's elegant, it sounds great, but it can get expensive when we calculate thousands of times per second.

So engineers came up with a clever workaround: lookup tables (LUTs). [Read more here.](https://lcav.gitbook.io/dsp-labs/alien-voice/dsp_tips#lookup)

Instead of computing expensive functions repeatedly, why not compute them once, store the results in a table, and then just look up values as needed?

This seems brilliant. Memory access should be faster than computation, right?
Let's test that assumption.

## LUTs: The Supposed Solution

A lookup table is a container of precomputed values. They map our amplitude's inputs to more desirable amplitude positions. Instead of computing tanh(x) 44,100 times per second, we compute it once, store those results as positions, and then just retrieve them.

The promise is simple: replace expensive per-sample computation with cheap memory lookups. Use more memory, save CPU cycles. Sounds like a great trade.

For example, rather than computing tanh() 44,100 times per second, we approximate it with a table containing a limited number of precomputed output values. Now each sample lookup should be cheaper.

But watch what happens when we reduce table size to improve performance even more. Fewer entries means faster lookups, right? But it also means coarser approximation. So there's a tradeoff between speed and accuracy.
## Testing Performance: LUT vs Tanh

Let me show you what I found. We'll compare tanh() against several LUT implementations. These differences can be microscopic, so I've artificially increased the load by processing each sample 50 times - this makes the performance differences visible.

> Note: This comparison focuses on core performance characteristics. I'm not including input range mapping, different interpolation patterns, oversampling, or hardware/OS differences - those deserve their own analysis.
### Simple LUT (1024 points)

After using a table of 1024 points, our LUT outperforms tanh() by 57% on CPU.

<div class="comparison-container">
    <code class="status-danger" style="font-size: 1.5rem;">Tanh(): 0.88% CPU</code>
    <code class="status-success" style="font-size: 1.5rem;">LUT (1024): 0.56% CPU</code>
</div>

In a typical DAW session, that's the difference between running 8 instances of a plugin versus 12.

Case closed, right? LUTs are faster!
Not so fast.

Let's look at what we're giving up:

This table has 1024 points. Our LUT outperforms tanh() because we're executing fewer instructions per sample:no exponential calculations, just array lookups.

But here's the tradeoff: we're exchanging fidelity for CPU performance. Our waveshaper can only output 1024 possible values, while tanh() can compute essentially infinite precision.

What if we could get closer to tanh() accuracy without increasing table size?

We can. This is where interpolation comes in.
### LUT with Interpolation

Interpolation estimates unknown values that fall between known data points: it fills in the gaps by assuming a pattern or trend.

If you've ever used keyframes in a video editor, you already understand this. Instead of animating every frame manually, motion is assumed based on surrounding keyframes.

Think of it like this: the points in our table have become like keyframes. When a sample's amplitude doesn't exactly match a table entry, we average between its two neighboring values to estimate what the output should be.

This should give us better accuracy while keeping the small table size. More accuracy and better performance? Sounds perfect.

Watch what happens:

<div class="comparison-container">
    <code class="status-success" style="font-size: 1.5rem;">Tanh(): 0.88% CPU</code>
    <code class="status-danger" style="font-size: 1.5rem;">LUT (1024 w/ interpolation): 0.94% CPU</code>
</div>



The LUT is no longer outperforming tanh().

Wait, what? We added interpolation to improve accuracy, but now our performance advantage disappeared. 

That's because interpolation isn't free. Every interpolated lookup now requires:
- Finding the two nearest table entries
- Calculating the fractional position between them
- Performing the weighted average

We've added multiple operations per sample. The "cheap" memory lookup just became more expensive computation.
You might be thinking: "Okay, but what if we decrease the table size? Fewer points means faster lookups even with interpolation, right?"

Let's try.
### LUT with Interpolation (512 points)

I reduced the table size from 1024 to 512 points. Here are the results:

<div class="comparison-container">
    <code class="status-success" style="font-size: 1.5rem;">Tanh(): 0.88% CPU</code>
    <code class="status-warning" style="font-size: 1.5rem;">LUT (512 w/ interpolation): 0.88% CPU</code>
</div>


The CPU performance is now neck-and-neck with tanh().

But remember: smaller table size means lower resolution. And lower resolution means artifacts.



<div class="chart-container">
    <div class="chart-header">
        <h3 class="chart-title">Aliasing & LUT Resolution Visualizer</h3>
        <div class="aliasing-control-group">
            <div class="aliasing-control-label">Points</div>
            <input id="aliasingSampleSlider" class="aliasing-slider" type="range" min="16" max="64" step="1" value="32">
            <div class="aliasing-control-value" id="aliasingSampleValue">32</div>
        </div>
    </div>
    <svg id="aliasingChart"></svg>
</div>

*How LUTs resolution changes the waveshaper's output.*

What does "lower resolution" actually mean in practice? Let's find out.
## Harmonic Comparison: The Hidden Cost

When we use a low-resolution waveshaper, we introduce quantization distortion - digital artifacts that weren't in the original signal. Here's why:

Small LUT sizes force coarse steps between each position. Instead of a smooth curve, we get a staircase. These steps generate additional harmonics that aren't present in a full-precision tanh() response. 

Watch what happens when we reduce our LUT to just 4 points:

<div class="chart-container static">
    <img src="{{ '/public/img/4_point_lut.svg' | url }}" alt="4 Point LUT Harmonic Analysis">
</div>



The black line is tanh(), the orange is our 4-point LUT. See those jagged steps? That's quantization noise.

Now we have extra harmonics above 10kHz. These are frequencies that shouldn't be there. This is quantization noise made audible. You might ask:

"At what table size do these artifacts disappear?"

I ran tests at different table sizes and found when the artifacts became inaudible. Let me show you the results.

## 64 Point Table vs Tanh()

I used the same sine wave sweep and compared both distortions. Here's what I found:

Our 64-point LUT implementation has an indistinguishable frequency response from tanh().

<div class="chart-container static">
    <img src="{{ '/public/img/64_point_lut.svg' | url }}" alt="64 Point LUT Harmonic Analysis">
</div>


*I had to offset the values because the overlap is near perfect*

This might look convincing, but there's one way to know for sure - a null test.
## The Null Test
A null test works by flipping the polarity of one signal and adding it to the other. If the signals are identical, they cancel completely. Any remaining signal is the difference between them.

Before polarity flip: Peak at -12dBFS
After polarity flip: Peak at -79.1dBFS

<div class="chart-container static">
    <img src="{{ '/public/img/null_test.svg' | url }}" alt="Null Test">
</div>

*The null test results from the 64-point LUT*

That's a reduction of 67dB - virtually silence. This confirms our 64-point LUT is essentially indistinguishable from tanh().

So we've found the sweet spot, right? 64 points gives us perfect accuracy. LUTs win!

Not quite. Look at the CPU performance again.
## The Dark Side of LUTs

Here's where our initial assumption falls apart completely.

Even after reducing our table size to 64 points (the minimum needed to avoid artifacts), the performance is still roughly the same as tanh().

<div class="comparison-container">
    <code class="status-success" style="font-size: 1.5rem;">Tanh(): 0.97% CPU</code>
    <code class="status-warning" style="font-size: 1.5rem;">LUT (64 w/ interpolation): 0.98% CPU</code>
</div>

Remember our original question? "Which is faster - looking up a value, or computing a function?"

The answer turned out to be misleading. Because LUTs don't just look up values. A properly implemented LUT that avoids quantization artifacts requires:
- Index calculation from the input sample
- Bounds checking
- Interpolation between adjacent points
- Scaling and range mapping

Each of these is a per-sample operation. We've replaced one expensive function with several cheaper operations - but those "cheaper" operations add up.

This is surprisingly common. In fact, depending on your implementation details, tanh() can actually be faster than a LUT. Some developers have found that using a polynomial approximation of tanh() outperforms LUTs entirely while maintaining accuracy.

[Read more about that here.](https://jatinchowdhury18.medium.com/lookup-tables-are-bad-approximators-6e4a712b912e)

The lesson here: LUTs aren't a silver bullet. Their performance varies dramatically based on:
- Table size
- Interpolation method
- Memory access patterns
- Cache efficiency
- Compiler optimizations

Your distortion could perform better or worse using them. The only way to know is to profile your specific implementation.
## What This Really Means

Let's return to where we started. The intuition that "memory lookups are faster than math" isn't wrong - it's just incomplete.

A LUT replaces one expensive set of instructions, but it introduces several other. It doesn't eliminate per-sample processing: it just changes what kind.

The real insight isn't "use LUTs" or "avoid LUTs." It's that performance optimization is rarely obvious. What seems faster on paper often isn't faster in practice. The only reliable approach is empirical:

Measure, profile, and test your assumptions.

This applies beyond distortion algorithms. Anytime you're optimizing, your intuition about what's "obviously" faster might be misleading.

## Try It Yourself

Want to test these results in your own environment? [The complete source code is available here.](https://github.com/RichardAnthonySanchez/static-vs-lut)

Want to contribute? I'd love to see implementations in C++ and Faust to compare against these JSFX results. Just open a PR.