export type SoundType = 'info' | 'success' | 'warning'

export const playSound = (type: SoundType = 'info') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()

    oscillator.connect(gain)
    gain.connect(audioContext.destination)

    const frequencies: Record<SoundType, number> = {
      info: 880,
      success: 1047,
      warning: 660,
    }

    oscillator.frequency.value = frequencies[type]
    oscillator.type = 'sine'

    gain.gain.setValueAtTime(0.3, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.15)
  } catch (err) {
    // Si hay error en audio context, simplemente no reproducir sonido
    console.debug('Audio context error:', err)
  }
}
