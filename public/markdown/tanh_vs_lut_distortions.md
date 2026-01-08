---
layout: base.njk
title: "Static vs LUT Distortion: A Performance Comparison"
subtitle: "Managing signal overhead and computational efficiency in digital audio"
author: "Richard Anthony Sanchez"
date: 2026-01-08
readTime: "8 min read"
tag: "DSP Research"
permalink: /index.html
---


## The Start of Digital Distortion

Engineers needed to manage signal. They noticed unpredictable behavior when systems overload. After trial and error they came to a reasonable conclusion: clipping.

Clipping was developed to contain signal within a system's operating range. Now has many different uses. 

Whether that's preserving headroom or distorting guitar tones, we can find clipping everywhere.

If clipping can be used in differently then what is it?
## What Is Clipping?

Clipping, saturation, and distortion: there's many different names but all of these do the same thing — flattens peaks and creates harmonic overtones as a result.  

A peak is the max amplitude (highest volume) of a signal. This peak is flattened when distortion is applied.

<div class="body-skeleton" style="height: 200px;">
    <div class="skeleton-shape" style="width: 80%; height: 2px; background: rgba(255,255,255,0.1);"></div>
    <div class="skeleton-shape" style="width: 80%; height: 60px; background: transparent; border: 2px dashed var(--accent-coral); border-radius: 4px;"></div>
</div>

*Comparison between pure sine wave and its distorted counterpart*

A harmonic comparison can also be made:

<div class="body-skeleton" style="height: 150px;">
    <div class="skeleton-shape" style="bottom: 10px; left: 50%; width: 4px; height: 100px; background: var(--accent-green);"></div>
</div>

*Here's how a 1khz sine wave looks on FFT*

<div class="body-skeleton" style="height: 150px;">
    <div class="skeleton-shape" style="bottom: 10px; left: 50%; width: 4px; height: 100px; background: var(--accent-coral);"></div>
    <div class="skeleton-shape" style="bottom: 10px; left: 60%; width: 4px; height: 60px; background: var(--accent-coral); opacity: 0.5;"></div>
    <div class="skeleton-shape" style="bottom: 10px; left: 70%; width: 4px; height: 40px; background: var(--accent-coral); opacity: 0.3;"></div>
</div>

*The same 1khz sine wave with distortion adds harmonic content*

These two approaches that confirm clipping is happening.
## Implementing Distortion in DSP

We can think of digital audio as snapshots of sound over regular time intervals. These are called samples.

 Much like movie is a series of pictures that imply motion, samples imply a continuous sound when played back in sequence. 
 
<div class="body-skeleton" style="height: 120px; flex-direction: row; gap: 8px;">
    <div class="skeleton-shape" style="width: 8px; height: 40px; background: var(--accent-coral);"></div>
    <div class="skeleton-shape" style="width: 8px; height: 70px; background: var(--accent-coral);"></div>
    <div class="skeleton-shape" style="width: 8px; height: 90px; background: var(--accent-coral);"></div>
    <div class="skeleton-shape" style="width: 8px; height: 60px; background: var(--accent-coral);"></div>
</div>

*A series of samples capturing a signal at regular intervals*

We use mathematical mapping to each of these samples based on its input amplitude. The smoothness of our clipping comes from which mathematical mapping approach we use.

We can confirm mapping is happening — I'm using a script that counts each sample being processed per second then measuring the results. 

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

Here's my results

<div class="body-skeleton" style="height: 100px;">
    <code style="font-size: 1.5rem;">44100 Hz</code>
</div>

*This session is set to 44.1khz sample rate and the logs confirm each sample is processed by our distortion implementation.*
## Expensive Processing

In CD-quality audio there are 44,100 samples happening every second. If our processing is happening at CD-quality then we can expect samples are being processed by our implementation 44,100 times every second.

The more steps in our mathematical functions, the more taxing this is on our system.

To reduce the cost of repeatedly evaluating expensive mathematical functions, engineers began using lookup tables (LUTs), which store precomputed values and replace computation with simple memory accesses. 

[Read more here](https://lcav.gitbook.io/dsp-labs/alien-voice/dsp_tips)
## LUTs

Lookup tables are containers of precomputed values that map raw inputs to desired outputs. In our case, each sample’s amplitude is used as an index into this table, instead of recomputing a function for every sample. The main advantage of LUTs is that they replace expensive per-sample computations with simple memory lookups, reducing CPU load at the cost of using more memory.

For example, rather than computing tanh⁡\tanhtanh 44,100 times per second, we can approximate it with a table that has a limited number of possible output values. With fewer entries in the table, each sample lookup is cheaper than a full function evaluation, but the approximation becomes coarser.

Any reduction in table size can improve performance, but it also increases approximation error, so there is a trade-off between speed and accuracy that needs to be evaluated for the specific application.
## Testing Performance: A comparison between LUT and Tanh

We will be doing shootouts between Tanh and a few LUT implementations. These changes can result in microscopic results so I'll have to artificially increase load. By looping processing by 50x we can make changes noticeable so that's what I'll be using.

> Note: For the sake of brevity, this comparison doesn't include the following:
> - Input range mapping
> - Differing interpolation patterns  
> - Oversampling
> - Differences in OS and software
> - Differences in hardware
### Simple LUT 

After using a table of 1024 points, our LUT out performs our implementation of tanh by 57% on the CPU

<div class="chart-container">
    <div class="chart-header">
        <h3 class="chart-title">LUT Distortion (Discrete)</h3>
        <div class="chart-controls">
            <div class="control-group">
                <div class="control-label">Drive <span class="control-value" id="driveVal">1.0</span></div>
                <input id="drive" type="range" min="0" max="10" step="0.1" value="1">
            </div>
            <div class="control-group">
                <div class="control-label">Samples <span class="control-value" id="sampleVal">16</span></div>
                <input id="samples" type="range" min="4" max="24" step="1" value="16">
            </div>
        </div>
    </div>
    <svg id="chart"></svg>
</div>



But is this case closed?

The table size in this example is 1024 points. The simple LUT out-performs the tanh implementation because less instructions are happening per sample. 

However this is a tradeoff  — we're exchanging fidelity for CPU performance.

But what if we could get closer to the accuracy of tanh without increasing our table size? 

We can. This is where interpolation comes in.
### LUT (with interpolation)

Interpolation is the process of estimating unknown values that fall between known data points, essentially filling in the gaps by assuming a pattern or trend. 

If you've ever used keyframes within a video editor, you're already familiar with this concept. Instead of animating every frame, motion is assumed based on surrounding keyframes. 

The points on our table have effectively become keyframes - when a sample's amplitude doesn't match a desired point, it is averaged between it's two neighboring values.

The problem is we're adding more operations per sample. 

After using a simple average between two points, this is our result:



The LUT is no longer out-performing our tanh implementation.

You might be asking, "What about decreasing the table size? Can we do that without removing interpolation?" We can!
### LUT (with interpolation reduced table size)

I reduced table size to 512 from 1024. Here are the results:

<div class="chart-container">
    <div class="chart-header">
        <h3 class="chart-title">Static Waveshaper (Index-Spaced)</h3>
        <div class="chart-controls">
            <div class="control-group">
                <div class="control-label">Drive <span class="control-value" id="driveValStatic">1.0</span></div>
                <input id="driveStatic" type="range" min="0" max="10" step="0.1" value="1">
            </div>
            <div class="control-group">
                <div class="control-label">Samples <span class="control-value" id="sampleValStatic">64</span></div>
                <input id="samplesStatic" type="range" min="4" max="256" step="1" value="64">
            </div>
        </div>
    </div>
    <svg id="chartStatic"></svg>
</div>



The CPU performance is now neck-and-neck. But remember: smaller table size means lower resolution. And lower resolution means artifacts.





*LUTs tradeoff in resolution displayed visually.*

But what does this "lower resolution" mean exactly? Let's find out!
## Harmonic Comparison

When low resolution wave shape we quantization distortion.

Small LUT sizes force coarse steps in the approximated tanh function, creating piecewise-linear segments instead of the ideal continuous curve. These steps generate additional harmonics not present in a full-precision tanh response. 

[Learn more about trade offs of other modified tanh functions here.](http://gdsp.hf.ntnu.no/lessons/3/18/)

We changed our LUT table down to 4 points and our frequency response changed as a result.



Red line is tanh and yellow is our 4 point LUT. 

This results in higher frequency overtones added. In my case, above 10khz.

You might be thinking, "At what table size do we prevent noticeable artifacts?"

We can prevent lookup table quantization noise by increasing table size. I found quantization artifacts disappear after using 64 points in our LUT.

We can confirm the elimination of quantization distortion by running more tests. This is what those looked like for me.

## 64 Point Table vs Tanh()

I used the sample sine wave with the same sweep in amplitude and compared against the two distortions. I'll let the results do the talking:

Our 64 point LUT implementation has an indistinguishable frequency response from our tanh function.

<div class="body-skeleton" style="height: 180px;">
    <div class="skeleton-shape" style="width: 80%; height: 2px; background: var(--accent-coral); box-shadow: 0 0 10px var(--accent-coral);"></div>
</div>


*I had to offset the values because the overlap is near perfect*

This could close but what makes it perfect? The only way to know for sure is to perform a null test.
### Before Polarity Flip


### After Polarity Flip


Before the polarity flip we peaked at -12dBFS. After the flip we peak at -79.1dBFS — virtually silence.

This confirms that our 64 point LUT is essentially indistinguishable from our tanh() implementation.

Why aren't we using LUTs exclusively if they're so good?
## The Dark Side of LUTs

Because LUTs give people freedom to choose instructions per second, they can ultimately add more overhead than math operations.

Even after reducing our table size to 64 points the performance is still roughly the same as tanh in my implementation.



This is surprisingly common. A LUT often doesn't only map each sample — it interpolates between values. This adds more operations per sample.

The more instructions we add, the more performance suffers. This could result in tanh being faster than your LUT implementation. 

[This article goes over using performant tanh() approximations over LUTs. It's worth a read!](https://jatinchowdhury18.medium.com/lookup-tables-are-bad-approximators-6e4a712b912e)

Implementing LUTs in DSP isn't a one-size-fits all — their performance varies significantly depending on implementation details.

Your distortion could be better or be worse using them. The only way to know for sure is to test.
## Conclusion

A LUT replaces one expensive nonlinear function, but it often adds several other operations per sample. Therefore, a LUT does not eliminate per-sample processing, it just changes what kind.

If you want to test for yourself, the source code can be found here: [https://github.com/RichardAnthonySanchez/static-vs-lut](https://github.com/RichardAnthonySanchez/static-vs-lut)

Want to contribute?  Add different languages like C++ and Faust. Just open a PR!

