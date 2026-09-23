/**
 * FreshMart Professional Web Audio API Sound Effects Engine
 * Generates soft, professional notification sounds using browser audio synthesis.
 * Zero external audio files, zero latency, works completely offline.
 */
(function() {
  let audioCtx = null;
  const playedEventCache = new Set();

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  // Unlock AudioContext on first user interaction to comply with browser autoplay policy
  function unlockAudio() {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    ["click", "keydown", "touchstart"].forEach(evt => {
      window.removeEventListener(evt, unlockAudio);
    });
  }
  ["click", "keydown", "touchstart"].forEach(evt => {
    window.addEventListener(evt, unlockAudio, { once: true, passive: true });
  });

  window.FreshMartSound = {
    isEnabled: function() {
      const val = localStorage.getItem("freshmart_sound_enabled");
      return val === null ? true : val === "true";
    },

    setEnabled: function(enabled) {
      localStorage.setItem("freshmart_sound_enabled", String(enabled));
      window.dispatchEvent(new CustomEvent("freshmart_sound_changed", { detail: { enabled } }));
    },

    toggle: function() {
      const current = this.isEnabled();
      this.setEnabled(!current);
      if (!current) {
        this.play("order_confirmed");
      }
      return !current;
    },

    playToneSequence: function(notes, volume = 0.12) {
      if (!this.isEnabled()) return;
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      notes.forEach(({ freq, delay = 0, duration = 0.25, type = "sine" }) => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = type;
          osc.frequency.setValueAtTime(freq, now + delay);

          gain.gain.setValueAtTime(0.0001, now + delay);
          gain.gain.exponentialRampToValueAtTime(volume, now + delay + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + delay);
          osc.stop(now + delay + duration + 0.05);
        } catch (e) {}
      });
    },

    play: function(soundType, dedupeKey = null) {
      if (dedupeKey) {
        if (playedEventCache.has(dedupeKey)) return;
        playedEventCache.add(dedupeKey);
        if (playedEventCache.size > 200) {
          const firstKey = playedEventCache.values().next().value;
          playedEventCache.delete(firstKey);
        }
      }

      if (!this.isEnabled()) return;

      switch (soundType) {
        case "new_order":
          this.playToneSequence([
            { freq: 880, delay: 0, duration: 0.18, type: "sine" },
            { freq: 1174.66, delay: 0.12, duration: 0.22, type: "sine" },
            { freq: 1760, delay: 0.24, duration: 0.35, type: "sine" }
          ], 0.15);
          break;

        case "order_confirmed":
          this.playToneSequence([
            { freq: 659.25, delay: 0, duration: 0.15, type: "sine" },
            { freq: 987.77, delay: 0.08, duration: 0.25, type: "sine" }
          ], 0.12);
          break;

        case "picking_started":
        case "packing":
          this.playToneSequence([
            { freq: 587.33, delay: 0, duration: 0.12, type: "sine" },
            { freq: 880, delay: 0.08, duration: 0.2, type: "sine" }
          ], 0.10);
          break;

        case "ready_for_handover":
        case "handover":
          this.playToneSequence([
            { freq: 523.25, delay: 0, duration: 0.15, type: "sine" },
            { freq: 659.25, delay: 0.08, duration: 0.15, type: "sine" },
            { freq: 1046.50, delay: 0.16, duration: 0.30, type: "sine" }
          ], 0.14);
          break;

        case "delivery_assigned":
        case "accepted":
          this.playToneSequence([
            { freq: 659.25, delay: 0, duration: 0.12, type: "sine" },
            { freq: 880, delay: 0.08, duration: 0.22, type: "sine" }
          ], 0.12);
          break;

        case "picked_up":
        case "out_for_delivery":
          this.playToneSequence([
            { freq: 698.46, delay: 0, duration: 0.12, type: "sine" },
            { freq: 880, delay: 0.07, duration: 0.14, type: "sine" },
            { freq: 1396.91, delay: 0.14, duration: 0.30, type: "sine" }
          ], 0.14);
          break;

        case "arrived":
          this.playToneSequence([
            { freq: 1046.50, delay: 0.15, duration: 0.15, type: "sine" },
            { freq: 1318.51, delay: 0.10, duration: 0.25, type: "sine" }
          ], 0.14);
          break;

        case "delivered":
          this.playToneSequence([
            { freq: 523.25, delay: 0, duration: 0.35, type: "sine" },
            { freq: 659.25, delay: 0.06, duration: 0.35, type: "sine" },
            { freq: 783.99, delay: 0.12, duration: 0.40, type: "sine" },
            { freq: 1046.50, delay: 0.18, duration: 0.50, type: "sine" }
          ], 0.16);
          break;

        default:
          this.playToneSequence([
            { freq: 880, delay: 0, duration: 0.2, type: "sine" }
          ], 0.10);
      }
    },

    playForStatus: function(status, dedupeKey = null) {
      if (!status) return;
      const norm = String(status).toUpperCase().replace(/[\s-]/g, '_');
      const map = {
        'ORDER_RECEIVED': 'new_order',
        'ORDER_PLACED': 'new_order',
        'ORDER_CONFIRMED': 'order_confirmed',
        'CONFIRMED': 'order_confirmed',
        'PICKING': 'picking_started',
        'PACKING': 'packing',
        'READY_FOR_HANDOVER': 'ready_for_handover',
        'READY_FOR_PICKUP': 'ready_for_handover',
        'HANDED_TO_DELIVERY_BOY': 'handover',
        'ASSIGNED': 'handover',
        'DELIVERY_BOY_ACCEPTED': 'accepted',
        'ACCEPTED': 'accepted',
        'PICKED_UP': 'picked_up',
        'OUT_FOR_DELIVERY': 'out_for_delivery',
        'ARRIVED': 'arrived',
        'CUSTOMER_VERIFIED': 'order_confirmed',
        'DELIVERED': 'delivered'
      };
      const soundType = map[norm] || 'order_confirmed';
      this.play(soundType, dedupeKey || (status + '_' + (Date.now() - (Date.now() % 500))));
    }
  };
})();

