# Audio DSP Pipeline Architecture

## Audio Processing Graph
The companion extension routes YouTube Music stream buffers through an isolated Web Audio context:

```
[ HTML5 Audio Element ] 
       |
       v
[ MediaElementAudioSourceNode ]
       |
       v
[ Biquad Peaking Filters (Parametric EQ) ]
       |
       v
[ DynamicsCompressorNode (Volume Normalization) ]
       |
       v
[ AudioDestination (Speakers / Headphones) ]
```

All filter coefficients recalculate in sub-millisecond intervals during active playback.
