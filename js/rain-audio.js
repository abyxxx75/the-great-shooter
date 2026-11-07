/* Original procedural rain: a soft continuous bed with scattered close droplets.
   Uses the gallery's audio context and mute control; no network audio dependency. */
export function createRainAudio() {
  let context;
  let buffer;
  let voice;
  let fadeTimer;

  function buildBuffer(audio) {
    const result = audio.createBuffer(2, audio.sampleRate * 12, audio.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const samples = result.getChannelData(channel);
      let low = 0;
      for (let i = 0; i < samples.length; i++) {
        const white = Math.random() * 2 - 1;
        low = low * .97 + white * .03;
        samples[i] = white * .12 + low * 1.8;
      }
      // Small, irregular taps blend into the rain bed instead of a repeating beat.
      for (let tap = 0; tap < 240; tap++) {
        const start = Math.floor(Math.random() * samples.length);
        const length = Math.floor(audio.sampleRate * (.012 + Math.random() * .025));
        const frequency = 900 + Math.random() * 1800;
        const strength = .025 + Math.random() * .065;
        for (let i = 0; i < length; i++) {
          const envelope = Math.sin(Math.PI * i / length) * Math.exp(-i / length * 5);
          samples[(start + i) % samples.length] += Math.sin(i / audio.sampleRate * frequency * Math.PI * 2) * envelope * strength;
        }
      }
    }
    return result;
  }

  function dispose() {
    if (!voice) return;
    voice.source.stop();
    voice.source.disconnect();
    voice.filter.disconnect();
    voice.volume.disconnect();
    voice = null;
  }

  return {
    update(audio, active) {
      clearTimeout(fadeTimer);
      if (!active || !audio || audio.state !== 'running') {
        if (!voice) return;
        voice.volume.gain.cancelScheduledValues(context.currentTime);
        voice.volume.gain.setTargetAtTime(0, context.currentTime, .08);
        fadeTimer = setTimeout(dispose, 400);
        return;
      }
      if (context !== audio) {
        dispose();
        context = audio;
        buffer = buildBuffer(audio);
      }
      if (!voice) {
        const source = audio.createBufferSource();
        const filter = audio.createBiquadFilter();
        const volume = audio.createGain();
        source.buffer = buffer;
        source.loop = true;
        filter.type = 'lowpass';
        filter.frequency.value = 3200;
        volume.gain.value = 0;
        source.connect(filter).connect(volume).connect(audio.destination);
        source.start();
        voice = { source, filter, volume };
      }
      voice.volume.gain.cancelScheduledValues(audio.currentTime);
      voice.volume.gain.setTargetAtTime(.32, audio.currentTime, .12);
    },
  };
}
