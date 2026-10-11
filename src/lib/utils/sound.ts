/**
 * Web Audio API Beep Synthesizer & Sound Player
 * Garantiza sonido de campana/alerta para pedidos nuevos sin depender de assets externos
 * y sin fallar por bloqueos de red o CORS.
 */

// Instancia compartida de AudioContext
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Desbloquea el AudioContext ante la primera interacción del usuario
 * (Requerido por políticas de Autoplay en Chrome/Safari/Edge/Firefox)
 */
export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

/**
 * Reproduce un tono de campana ("Ding-Dong" de alta fidelidad) usando osciladores web nativos.
 */
function playSynthesizedChime(ctx: AudioContext) {
  try {
    const now = ctx.currentTime;

    // Tono 1: Campana alta (880Hz -> A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(440, now + 0.35);

    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tono 2: Resonancia de cocina (587.33Hz -> D5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(587.33, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(293.66, now + 0.6);

    gain2.gain.setValueAtTime(0.35, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch (err) {
    console.warn('[Audio] Error al sintetizar sonido:', err);
  }
}

/**
 * Función pública para reproducir el timbre de nuevo pedido.
 * Intenta primero el archivo MP3 y como respaldo infalible ejecuta el sintetizador nativo.
 */
export function playNewOrderSound() {
  if (typeof window === 'undefined') return;

  const ctx = getAudioContext();
  if (ctx && ctx.state === 'running') {
    playSynthesizedChime(ctx);
    return;
  }

  // Intento de fallback con elemento HTMLAudioElement
  try {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.volume = 0.7;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Si el navegador bloqueó el autoplay del MP3, intentamos reanudar audioCtx y sintetizar
        if (ctx) {
          ctx.resume().then(() => playSynthesizedChime(ctx)).catch(() => {});
        }
      });
    }
  } catch {
    if (ctx) {
      playSynthesizedChime(ctx);
    }
  }
}
