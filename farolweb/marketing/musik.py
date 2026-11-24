# Eigene, lizenzfreie Musik für das FarolWeb-Reel: Tropical-/Summer-Groove, 120 BPM, 21 s
import numpy as np, wave
SR = 44100; DUR = 21.0; BPM = 120; B = 60 / BPM; BAR = 4 * B
N = int(SR * DUR); L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)

def f(note):  # MIDI → Hz
    return 440 * 2 ** ((note - 69) / 12)

def add(sig, t, pan=0.0, gain=1.0):
    i = int(t * SR); j = min(N, i + len(sig))
    if i >= N: return
    s = sig[: j - i] * gain
    L[i:j] += s * (1 - pan) ; R[i:j] += s * (1 + pan)

def env(n, a=0.005, d=0.3):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / d)

def tone(freq, dur, harm=((1, 1),), a=0.005, d=0.3):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(g * np.sin(2 * np.pi * freq * h * t) for h, g in harm)
    return s * env(n, a, d)

def kick():
    n = int(0.35 * SR); t = np.arange(n) / SR
    fr = 50 + 110 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 9)

def clap():
    n = int(0.25 * SR); t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    # einfacher Hochpass durch Differenz
    nz = np.diff(nz, prepend=0)
    return nz * np.exp(-t * 18) * 0.35

def hat(open_=False):
    n = int((0.12 if open_ else 0.04) * SR); t = np.arange(n) / SR
    nz = np.diff(rng.standard_normal(n), prepend=0)
    return nz * np.exp(-t * (25 if open_ else 90)) * 0.18

# Akkorde: A – F#m – D – E  (Wurzeln für Bass, Dreiklänge für Pluck)
PROG = [(57, [69, 73, 76]), (54, [66, 69, 73]), (50, [66, 69, 74]), (52, [68, 71, 76])]
EP = ((1, 1), (2, .35), (3, .12))
MAR = ((1, 1), (4, .25), (10, .05))

# Melodie (Takt-relativ, in Beats) – A-Dur-Pentatonik
MEL = [
    [(0, 76), (1, 78), (1.5, 76), (2.5, 73), (3, 71)],
    [(0, 73), (1, 76), (2, 78), (3, 81)],
    [(0, 78), (0.5, 76), (1.5, 74), (2.5, 76), (3.5, 78)],
    [(0, 80), (1, 76), (2, 83), (3, 81)],
]

nbars = int(np.ceil(DUR / BAR))
for bar in range(nbars):
    t0 = bar * BAR
    root, chord = PROG[bar % 4]
    drums = bar >= 1 and t0 < 19.0
    # Bass: punktierte Achtel
    if bar >= 1 and t0 < 19.5:
        for k, off in enumerate([0, 0.75, 1.5, 2, 2.75, 3.5]):
            nt = root - 12 + (12 if k in (2, 5) else 0)
            add(tone(f(nt), 0.4, ((1, 1), (2, .3)), a=0.004, d=0.18), t0 + off * B, 0, 0.55)
    # Chord-Pluck auf den Offbeats (Tropical-Skank)
    for off in [0.5, 1.5, 2.5, 3.5]:
        for i, nt in enumerate(chord):
            add(tone(f(nt), 0.45, EP, a=0.003, d=0.16), t0 + off * B, (i - 1) * 0.35, 0.16)
    # Pad (weich) für Fülle
    for nt in chord:
        sig = tone(f(nt - 12), BAR, ((1, 1), (2, .2)), a=0.25, d=3.0) * 0.06
        add(sig, t0, 0, 1)
    # Drums
    if drums:
        for b in range(4):
            add(kick(), t0 + b * B, 0, 0.9)
        for b in (1, 3):
            add(clap(), t0 + b * B, 0.1, 1)
        for e in range(8):
            add(hat(open_=(e % 2 == 1)), t0 + e * B / 2 + (0.02 if e % 2 else 0), -0.3 if e % 2 else 0.3, 1)
    # Melodie ab Takt 2, Marimba
    if bar >= 2 and t0 < 19.0:
        for off, nt in MEL[bar % 4]:
            add(tone(f(nt), 0.5, MAR, a=0.002, d=0.22), t0 + off * B, 0.25, 0.28)
            add(tone(f(nt), 0.5, MAR, a=0.002, d=0.22), t0 + off * B + 0.375, -0.35, 0.09)  # Echo

# Schlussakkord bei 19.5 s, lang ausklingend
for i, nt in enumerate([57, 69, 73, 76, 81]):
    add(tone(f(nt), 2.0, EP, a=0.004, d=0.9), 19.5, (i - 2) * 0.2, 0.22)
add(kick(), 19.5, 0, 0.9)

# Fade-in/-out, Normalisieren, sanfte Sättigung
t = np.arange(N) / SR
fade = np.minimum(1, t / 0.3) * np.clip((DUR - t) / 0.8, 0, 1)
L *= fade; R *= fade
peak = max(np.abs(L).max(), np.abs(R).max())
L = np.tanh(L / peak * 1.2) * 0.85; R = np.tanh(R / peak * 1.2) * 0.85
data = (np.stack([L, R], 1) * 32767).astype(np.int16)
with wave.open('music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())
print('ok', DUR, 's')
