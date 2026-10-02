/**
 * ============================================================================
 * TETRO / BALATRO - GAME ENGINE (Vanilla JS)
 * Tetris clássico com visual, combos, multiplicadores e intensidade Balatro.
 * 100% puro: Sem frameworks, sem bibliotecas, sem arquivos externos.
 * ============================================================================
 */

(function () {
  'use strict';

  // --- CONFIGURAÇÕES DO TABULEIRO ---
  const COLS = 10;
  const ROWS = 20;
  const BLOCK_SIZE = 32; // 320x640 canvas

  // --- PALETA DAS 7 PEÇAS (Estilo Balatro Saturado / Chips) ---
  const TETROMINO_COLORS = {
    I: { base: '#0bd4bd', light: '#70fff0', dark: '#056d61', shadow: '#033f38' }, // Ciano
    O: { base: '#f4be13', light: '#ffec78', dark: '#9c7704', shadow: '#594401' }, // Ouro
    T: { base: '#9b51e0', light: '#d399ff', dark: '#5b1ea1', shadow: '#371064' }, // Roxo
    S: { base: '#2ecc71', light: '#86ffb6', dark: '#167a3e', shadow: '#0c4d26' }, // Verde
    Z: { base: '#ea3c36', light: '#ff8681', dark: '#8f1b17', shadow: '#590e0b' }, // Vermelho
    J: { base: '#008ee6', light: '#68c8ff', dark: '#00538a', shadow: '#003357' }, // Azul
    L: { base: '#f49b13', light: '#ffd175', dark: '#995a00', shadow: '#5e3700' }  // Laranja
  };

  // Formas das 7 peças (matrizes 4x4 ou 3x3)
  const SHAPES = {
    I: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    O: [
      [1, 1],
      [1, 1]
    ],
    T: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    J: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    L: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ]
  };

  // --- SRS (SUPER ROTATION SYSTEM) WALL KICK DATA ---
  // Kicks para J, L, S, T, Z
  const KICKS_JLSTZ = {
    '0->1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '1->0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    '1->2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    '2->1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '2->3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    '3->2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '3->0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '0->3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]]
  };

  // Kicks para a peça I
  const KICKS_I = {
    '0->1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    '1->0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    '1->2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    '2->1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    '2->3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    '3->2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    '3->0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    '0->3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]]
  };

  // --- CATÁLOGO DE ITENS ROGUELIKE (Estilo Balatro - Passivos e Acumuláveis) ---
  const ROGUELIKE_ITEMS = {
    ficha_dourada: {
      id: 'ficha_dourada',
      name: 'Ficha Dourada',
      icon: '🪙',
      rarity: 'COMUM',
      rarityClass: 'rarity-comum',
      weight: 60,
      desc: (stacks) => `+0,25 no multiplicador base por stack (Atual: +${(stacks * 0.25).toFixed(2)})`
    },
    relogio_areia: {
      id: 'relogio_areia',
      name: 'Relógio de Areia',
      icon: '⏳',
      rarity: 'COMUM',
      rarityClass: 'rarity-comum',
      weight: 60,
      desc: (stacks) => `Queda das peças 8% mais lenta por stack (Atual: -${stacks * 8}% vel.)`
    },
    ima_combo: {
      id: 'ima_combo',
      name: 'Ímã de Combo',
      icon: '🧲',
      rarity: 'INCOMUM',
      rarityClass: 'rarity-incomum',
      weight: 30,
      desc: (stacks) => `Tolerância de ${stacks} peça(s) sem limpar para manter o combo`
    },
    bomba_pequena: {
      id: 'bomba_pequena',
      name: 'Bomba Pequena',
      icon: '💣',
      rarity: 'INCOMUM',
      rarityClass: 'rarity-incomum',
      weight: 30,
      desc: (stacks) => `A cada 20 peças, surge uma peça bomba que limpa área 3x3 (Nv.${stacks})`
    },
    cartao_extra: {
      id: 'cartao_extra',
      name: 'Cartão Extra',
      icon: '🃏',
      rarity: 'COMUM',
      rarityClass: 'rarity-comum',
      weight: 60,
      desc: (stacks) => `+${stacks} uso(s) de Hold por peça (Total: ${1 + stacks} por peça)`
    },
    prisma: {
      id: 'prisma',
      name: 'Prisma',
      icon: '💎',
      rarity: 'RARA',
      rarityClass: 'rarity-rara',
      weight: 10,
      desc: (stacks) => `+${stacks} nível de intensidade visual ao limpar linhas`
    },
    juros: {
      id: 'juros',
      name: 'Juros',
      icon: '📈',
      rarity: 'INCOMUM',
      rarityClass: 'rarity-incomum',
      weight: 30,
      desc: (stacks) => `+${stacks * 5}% de pontuação bônus por combo ativo`
    },
    escudo: {
      id: 'escudo',
      name: 'Escudo',
      icon: '🛡️',
      rarity: 'RARA',
      rarityClass: 'rarity-rara',
      weight: 10,
      desc: (stacks) => `Evita ${stacks} Game Over(s), limpando 4 linhas do topo`
    }
  };

  // ============================================================================
  // MOTOR DE ÁUDIO SINTETIZADO (Web Audio API - Sem arquivos)
  // ============================================================================
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.musicPlaying = false;
      this.stepTimer = null;
      this.currentStep = 0;
      this.bpm = 118;
      this.initOnFirstGesture();
    }

    initContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    initOnFirstGesture() {
      const unlock = () => {
        this.initContext();
        if (this.ctx && !this.musicPlaying && !this.isMuted) {
          this.startMusic();
        }
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('pointerdown', unlock);
      };
      window.addEventListener('keydown', unlock);
      window.addEventListener('pointerdown', unlock);
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      if (this.isMuted) {
        this.stopMusic();
      } else {
        this.initContext();
        this.startMusic();
      }
      return this.isMuted;
    }

    // Som de mover a peça
    playMove() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.04);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.04);
    }

    // Som de girar a peça
    playRotate() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, t);
      osc.frequency.exponentialRampToValueAtTime(620, t + 0.06);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.06);
    }

    // Som de pousar (soft drop / lock suave)
    playLand() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.07);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.07);
    }

    // Som de Hard Drop (batida forte de impacto)
    playHardDrop() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    }

    // Som de Hold (whoosh de carta)
    playHold() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.linearRampToValueAtTime(440, t + 0.05);
      osc.frequency.linearRampToValueAtTime(220, t + 0.1);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    }

    // Som de Linha Limpa (acorde musical que sobe com o combo)
    playLineClear(lines, combo) {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;

      // Escala pentatônica em tons Balatro (C4, D4, E4, G4, A4, C5, etc.)
      const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];
      const baseIdx = Math.min(scale.length - 4, combo);
      const root = scale[baseIdx];

      const intervals = lines >= 4
        ? [0, 4, 7, 12] // Acorde maior glorioso (TETRIS!)
        : lines === 3
        ? [0, 4, 7]
        : lines === 2
        ? [0, 4]
        : [0];

      intervals.forEach((semi, idx) => {
        const noteFreq = root * Math.pow(2, semi / 12);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = lines >= 4 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(noteFreq, t + idx * 0.04);

        const duration = lines >= 4 ? 0.45 : 0.28;
        gain.gain.setValueAtTime(0.18 / intervals.length, t + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.04);
        osc.stop(t + idx * 0.04 + duration);
      });
    }

    // Som de Level Up
    playLevelUp() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.07);
        gain.gain.setValueAtTime(0.2, t + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.07);
        osc.stop(t + idx * 0.07 + 0.2);
      });
    }

    // Som de Game Over
    playGameOver() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.linearRampToValueAtTime(80, t + 0.8);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.85);
    }

    // Som ao abrir a tela de escolha de itens (mistério/fanfarra mágica)
    playItemOffer() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      [330, 415.3, 493.88, 659.25].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.06);
        gain.gain.setValueAtTime(0.14, t + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.06);
        osc.stop(t + idx * 0.06 + 0.3);
      });
    }

    // Som ao escolher um item (carta Balatro triunfante)
    playItemPick() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.05);
        gain.gain.setValueAtTime(0.18, t + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.05);
        osc.stop(t + idx * 0.05 + 0.35);
      });
    }

    // Som de explosão da Bomba Pequena
    playExplosion() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.35);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    }

    // Som de ativação salvadora do Escudo
    playShieldRevive() {
      if (this.isMuted || !this.ctx) return;
      const t = this.ctx.currentTime;
      [261.63, 329.63, 392.0, 523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.05);
        gain.gain.setValueAtTime(0.2, t + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.05);
        osc.stop(t + idx * 0.05 + 0.4);
      });
    }

    // Música Chiptune em Loop (Sequenciador procedural estilo Balatro jazz/chiptune)
    startMusic() {
      if (this.musicPlaying || this.isMuted || !this.ctx) return;
      this.musicPlaying = true;
      this.currentStep = 0;

      // Linha de baixo (D menor / A menor jazz retro)
      const bassNotes = [
        146.83, 0, 146.83, 174.61, 164.81, 0, 146.83, 0,
        130.81, 0, 130.81, 146.83, 110.0, 0, 123.47, 0
      ];

      // Arpeggios melódicos suaves
      const leadNotes = [
        293.66, 349.23, 440.0, 523.25, 440.0, 349.23, 293.66, 0,
        261.63, 329.63, 392.0, 440.0, 392.0, 329.63, 246.94, 261.63
      ];

      const stepIntervalMs = (60 / this.bpm / 2) * 1000;

      const tick = () => {
        if (!this.musicPlaying || this.isMuted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const step = this.currentStep % 16;

        // Baixo
        const bFreq = bassNotes[step];
        if (bFreq > 0) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(bFreq, t);
          gain.gain.setValueAtTime(0.06, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.2);
        }

        // Melodia
        const lFreq = leadNotes[step];
        if (lFreq > 0 && step % 2 === 0) {
          const oscL = this.ctx.createOscillator();
          const gainL = this.ctx.createGain();
          oscL.type = 'sine';
          oscL.frequency.setValueAtTime(lFreq, t);
          gainL.gain.setValueAtTime(0.035, t);
          gainL.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
          oscL.connect(gainL);
          gainL.connect(this.ctx.destination);
          oscL.start(t);
          oscL.stop(t + 0.18);
        }

        // Hi-hat sutil (ruído estalo)
        if (step % 2 === 1) {
          const oscH = this.ctx.createOscillator();
          const gainH = this.ctx.createGain();
          oscH.type = 'square';
          oscH.frequency.setValueAtTime(1400 + (step * 80), t);
          gainH.gain.setValueAtTime(0.015, t);
          gainH.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
          oscH.connect(gainH);
          gainH.connect(this.ctx.destination);
          oscH.start(t);
          oscH.stop(t + 0.035);
        }

        this.currentStep++;
        this.stepTimer = setTimeout(tick, stepIntervalMs);
      };

      this.stepTimer = setTimeout(tick, stepIntervalMs);
    }

    stopMusic() {
      this.musicPlaying = false;
      if (this.stepTimer) {
        clearTimeout(this.stepTimer);
        this.stepTimer = null;
      }
    }
  }

  // ============================================================================
  // SISTEMA DE PARTÍCULAS CANVAS (Faíscas, Confetes, Flocos)
  // ============================================================================
  class ParticleEngine {
    constructor(canvas, ctx) {
      this.canvas = canvas;
      this.ctx = ctx;
      this.particles = [];
    }

    spawnLineClear(yRow, count, intensity, color) {
      const py = yRow * BLOCK_SIZE + BLOCK_SIZE / 2;
      for (let i = 0; i < count; i++) {
        const px = Math.random() * (COLS * BLOCK_SIZE);
        const speed = 1.5 + Math.random() * (3 + intensity * 0.8);
        const angle = Math.random() * Math.PI * 2;
        this.particles.push({
          x: px,
          y: py + (Math.random() - 0.5) * BLOCK_SIZE,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (1 + Math.random() * 2),
          size: 3 + Math.random() * (4 + intensity * 0.6),
          color: color || (Math.random() > 0.5 ? '#f4be13' : '#ea3c36'),
          rot: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.25,
          alpha: 1,
          decay: 0.015 + Math.random() * 0.02,
          gravity: 0.12,
          shape: intensity >= 6 && Math.random() > 0.4 ? 'star' : 'rect'
        });
      }
    }

    spawnHardDrop(colX, rowY, count) {
      const px = colX * BLOCK_SIZE;
      const py = rowY * BLOCK_SIZE;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: px + Math.random() * (BLOCK_SIZE * 3),
          y: py,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 3,
          size: 2 + Math.random() * 3,
          color: '#ffffff',
          rot: 0,
          vRot: 0,
          alpha: 0.8,
          decay: 0.04,
          gravity: 0.15,
          shape: 'rect'
        });
      }
    }

    // Explosão em área para a Bomba Pequena
    spawnExplosion(gridX, gridY) {
      const px = gridX * BLOCK_SIZE + BLOCK_SIZE / 2;
      const py = gridY * BLOCK_SIZE + BLOCK_SIZE / 2;
      for (let i = 0; i < 40; i++) {
        const speed = 2 + Math.random() * 6;
        const angle = Math.random() * Math.PI * 2;
        this.particles.push({
          x: px,
          y: py,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          size: 4 + Math.random() * 5,
          color: Math.random() > 0.4 ? '#ea3c36' : (Math.random() > 0.5 ? '#f49b13' : '#ffd700'),
          rot: Math.random() * Math.PI,
          vRot: (Math.random() - 0.5) * 0.35,
          alpha: 1,
          decay: 0.02 + Math.random() * 0.02,
          gravity: 0.14,
          shape: Math.random() > 0.4 ? 'star' : 'rect'
        });
      }
    }

    updateAndDraw() {
      if (this.particles.length === 0) return;

      this.ctx.save();
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rot += p.vRot;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.globalAlpha = Math.max(0, p.alpha);
        this.ctx.fillStyle = p.color;

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rot);

        if (p.shape === 'star') {
          // Pequena estrela / centelha
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
          this.ctx.fill();
        } else {
          // Retângulo / confete
          this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        this.ctx.restore();
      }
      this.ctx.restore();
    }
  }

  // ============================================================================
  // CLASSE PRINCIPAL DO JOGO TETRIS BALATRO
  // ============================================================================
  class TetrisGame {
    constructor() {
      // Elementos do DOM
      this.mainCanvas = document.getElementById('tetrisCanvas');
      this.mainCtx = this.mainCanvas.getContext('2d');

      this.holdCanvas = document.getElementById('holdCanvas');
      this.holdCtx = this.holdCanvas.getContext('2d');

      this.nextCanvases = [
        document.getElementById('nextCanvas1'),
        document.getElementById('nextCanvas2'),
        document.getElementById('nextCanvas3')
      ];
      this.nextCtxs = this.nextCanvases.map(c => c.getContext('2d'));

      // DOM UI Elements
      this.scoreValEl = document.getElementById('scoreVal');
      this.chipsValEl = document.getElementById('chipsVal');
      this.multValEl = document.getElementById('multVal');
      this.chipsBoxEl = document.getElementById('chipsBox');
      this.multBoxEl = document.getElementById('multBox');
      this.comboCountEl = document.getElementById('comboCount');
      this.comboBubbleEl = document.getElementById('comboBubble');
      this.b2bBadgeEl = document.getElementById('b2bBadge');
      this.levelValEl = document.getElementById('levelVal');
      this.linesValEl = document.getElementById('linesVal');
      this.highScoreValEl = document.getElementById('highScoreVal');
      this.intensityNumEl = document.getElementById('intensityNum');
      this.intensityBarFillEl = document.getElementById('intensityBarFill');
      this.intensityBadgeEl = document.getElementById('intensityBadge');
      this.boardFrameEl = document.getElementById('boardFrame');
      this.gameWrapperEl = document.getElementById('gameWrapper');
      this.floatContainerEl = document.getElementById('floatBannerContainer');

      // Modais
      this.pauseOverlayEl = document.getElementById('pauseOverlay');
      this.gameOverOverlayEl = document.getElementById('gameOverOverlay');
      this.finalScoreValEl = document.getElementById('finalScoreVal');
      this.finalLinesValEl = document.getElementById('finalLinesVal');
      this.finalLevelValEl = document.getElementById('finalLevelVal');
      this.finalComboValEl = document.getElementById('finalComboVal');
      this.newRecordBadgeEl = document.getElementById('newRecordBadge');

      // Elementos do Modal de Itens Roguelike e Barra Lateral
      this.itemChoiceOverlayEl = document.getElementById('itemChoiceOverlay');
      this.itemCardsGridEl = document.getElementById('itemCardsGrid');
      this.itemsListTrayEl = document.getElementById('itemsListTray');
      this.itemCountValEl = document.getElementById('itemCountVal');
      this.nextItemLinesValEl = document.getElementById('nextItemLinesVal');
      this.holdSubtextEl = document.getElementById('holdSubtext');

      // Botões
      this.btnSound = document.getElementById('btnSound');
      this.soundIcon = document.getElementById('soundIcon');
      this.btnPause = document.getElementById('btnPause');
      this.btnResume = document.getElementById('btnResume');
      this.btnRestart = document.getElementById('btnRestart');
      this.btnPlayAgain = document.getElementById('btnPlayAgain');

      // Motores Auxiliares
      this.sound = new SoundEngine();
      this.particles = new ParticleEngine(this.mainCanvas, this.mainCtx);

      // Estado do Tabuleiro
      this.grid = this.createEmptyGrid();

      // Estado das Peças
      this.bag = [];
      this.currentPiece = null;
      this.holdPiece = null;
      this.canHold = true;
      this.holdCountForPiece = 0; // Para suporte ao Cartão Extra
      this.nextQueue = [];

      // Dados de Jogo
      this.score = 0;
      this.lines = 0;
      this.level = 1;
      this.combo = 0;
      this.maxCombo = 0;
      this.isBackToBack = false;
      this.highScore = parseInt(localStorage.getItem('tetro_balatro_highscore') || '0', 10);
      this.highScoreValEl.textContent = this.highScore.toLocaleString();

      // Sistema de Itens Roguelike
      this.activeItems = {}; // { itemId: stackCount }
      this.nextItemLinesTarget = 15; // Gatilho a cada 15 linhas limpas
      this.isChoosingItem = false;
      this.offeredItems = [];
      this.comboToleranceRemaining = 0; // Suporte ao Ímã de Combo
      this.totalPiecesCount = 0; // Suporte à Bomba Pequena (a cada 20 peças)

      // Controle do Overlay de Combo (substituição limpa sem sobreposição nem bugs)
      this.currentComboOverlay = null;
      this.comboOverlayTimer = null;

      // Intensidade Balatro (0 a 10)
      this.intensity = 0;
      this.shakeTimer = 0;
      this.shakeIntensity = 0;
      this.boardSquashTimer = 0;

      // Estados de Controle
      this.isPaused = false;
      this.isGameOver = false;

      // Timers e Queda
      this.lastTime = 0;
      this.dropCounter = 0;
      this.lockDelayCounter = 0;
      this.lockDelayLimit = 500; // 500ms de tolerância SRS no chão
      this.isOnFloor = false;

      // Linhas em animação de flash branco
      this.clearingRows = [];
      this.clearAnimTimer = 0;
      this.clearAnimDuration = 220; // ms

      // Controles Teclado (DAS e ARR)
      this.keys = {};
      this.dasDelay = 150; // ms antes do auto-repeat
      this.arrRate = 32;   // ms entre repetições
      this.dasTimers = { left: 0, right: 0, down: 0 };
      this.dasActive = { left: false, right: false, down: false };

      this.setupControls();
      this.resetGame();
      this.startLoop();
    }

    createEmptyGrid() {
      const grid = [];
      for (let r = 0; r < ROWS; r++) {
        grid.push(new Array(COLS).fill(null));
      }
      return grid;
    }

    // Sistema 7-Bag
    refillBag() {
      const types = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      // Fisher-Yates Shuffle
      for (let i = types.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [types[i], types[j]] = [types[j], types[i]];
      }
      this.bag.push(...types);
    }

    getNextPieceType() {
      if (this.bag.length < 7) {
        this.refillBag();
      }
      return this.bag.shift();
    }

    spawnPiece(type) {
      this.totalPiecesCount++;
      const shape = SHAPES[type].map(row => [...row]);
      const bombaStacks = this.getItemStacks('bomba_pequena');
      // A cada 20 peças, uma peça vira bomba que limpa uma área 3x3 ao pousar
      const isBomb = (bombaStacks > 0 && this.totalPiecesCount % 20 === 0);

      const piece = {
        type: type,
        shape: shape,
        rot: 0,
        x: Math.floor(COLS / 2) - Math.ceil(shape[0].length / 2),
        y: type === 'I' ? -1 : 0,
        isBomb: isBomb
      };

      if (isBomb) {
        this.spawnScorePopup('💣 PEÇA BOMBA ATIVA (3x3)!', 60);
      }

      // Se já não cabe ao spawnar, Game Over (ou Escudo evita)
      if (this.checkCollision(piece, piece.x, piece.y, piece.shape)) {
        const saved = this.triggerGameOver();
        if (saved) {
          return this.currentPiece;
        }
        return null;
      }
      return piece;
    }

    resetGame() {
      this.grid = this.createEmptyGrid();
      this.score = 0;
      this.lines = 0;
      this.level = 1;
      this.combo = 0;
      this.maxCombo = 0;
      this.isBackToBack = false;
      this.intensity = 0;
      this.isGameOver = false;
      this.isPaused = false;
      this.holdPiece = null;
      this.canHold = true;
      this.holdCountForPiece = 0;
      this.clearingRows = [];
      this.bag = [];
      this.refillBag();
      this.refillBag();

      // Reset total dos itens roguelike
      this.activeItems = {};
      this.nextItemLinesTarget = 15;
      this.isChoosingItem = false;
      this.offeredItems = [];
      this.comboToleranceRemaining = 0;
      this.totalPiecesCount = 0;

      // Limpar overlays e modais anteriores
      this.clearComboOverlay();
      if (this.itemChoiceOverlayEl) {
        this.itemChoiceOverlayEl.classList.add('hidden');
      }

      this.nextQueue = [
        this.getNextPieceType(),
        this.getNextPieceType(),
        this.getNextPieceType()
      ];

      this.currentPiece = this.spawnPiece(this.getNextPieceType());

      this.pauseOverlayEl.classList.add('hidden');
      this.gameOverOverlayEl.classList.add('hidden');
      this.newRecordBadgeEl.classList.add('hidden');
      this.b2bBadgeEl.classList.add('hidden');

      this.updateUI();
      this.updateItemsUI();
      this.updateHoldUI();
      this.renderHold();
      this.renderNextQueue();
    }

    // ============================================================================
    // CONTROLES DE ENTRADA & EVENTOS
    // ============================================================================
    setupControls() {
      // Conjunto com todas as teclas utilizadas no jogo para prevenir o comportamento padrão (rolagem/tremer da página)
      const GAME_KEYS = new Set([
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
        'Space', ' ',
        'KeyX', 'x', 'X',
        'KeyZ', 'z', 'Z',
        'KeyC', 'c', 'C',
        'KeyP', 'p', 'P',
        'Escape', 'Esc',
        'KeyR', 'r', 'R',
        'KeyM', 'm', 'M',
        'Digit1', 'Digit2', 'Digit3',
        'Numpad1', 'Numpad2', 'Numpad3',
        '1', '2', '3'
      ]);

      window.addEventListener('keydown', e => {
        // Bloqueia qualquer rolagem de tela ou ação nativa do navegador imediatamente,
        // inclusive quando a tecla é mantida pressionada (key repeat / e.repeat === true)
        if (GAME_KEYS.has(e.code) || GAME_KEYS.has(e.key)) {
          e.preventDefault();
        }

        if (e.repeat) return; // Gerenciamos nosso próprio DAS/ARR para repetição contínua
        this.keys[e.code] = true;

        if (this.isGameOver) {
          if (e.code === 'KeyR' || e.key === 'r' || e.key === 'R') {
            this.resetGame();
          }
          return;
        }

        // Escolha de itens Roguelike (teclas 1, 2 ou 3)
        if (this.isChoosingItem) {
          if (e.code === 'Digit1' || e.code === 'Numpad1' || e.key === '1') {
            this.selectOfferedItem(0);
            return;
          }
          if (e.code === 'Digit2' || e.code === 'Numpad2' || e.key === '2') {
            this.selectOfferedItem(1);
            return;
          }
          if (e.code === 'Digit3' || e.code === 'Numpad3' || e.key === '3') {
            this.selectOfferedItem(2);
            return;
          }
          // Bloqueia qualquer outro comando durante a escolha
          return;
        }

        // Pausa
        if (e.code === 'KeyP' || e.key === 'p' || e.key === 'P' || e.code === 'Escape' || e.key === 'Escape') {
          this.togglePause();
          return;
        }

        if (this.isPaused) return;

        // Ações imediatas
        switch (e.code) {
          case 'ArrowLeft':
            this.moveLeft();
            this.dasActive.left = true;
            this.dasTimers.left = performance.now() + this.dasDelay;
            break;
          case 'ArrowRight':
            this.moveRight();
            this.dasActive.right = true;
            this.dasTimers.right = performance.now() + this.dasDelay;
            break;
          case 'ArrowUp':
          case 'KeyX':
            this.rotatePiece(1); // Horário
            break;
          case 'KeyZ':
            this.rotatePiece(-1); // Anti-horário
            break;
          case 'ArrowDown':
            this.softDrop();
            this.dasActive.down = true;
            this.dasTimers.down = performance.now() + (this.dasDelay / 2);
            break;
          case 'Space':
            this.hardDrop();
            break;
          case 'KeyC':
            this.doHold();
            break;
          case 'KeyM':
            this.toggleMute();
            break;
          case 'KeyR':
            this.resetGame();
            break;
        }
      });

      window.addEventListener('keyup', e => {
        this.keys[e.code] = false;
        if (e.code === 'ArrowLeft') this.dasActive.left = false;
        if (e.code === 'ArrowRight') this.dasActive.right = false;
        if (e.code === 'ArrowDown') this.dasActive.down = false;
      });

      // Botões do DOM
      this.btnSound.addEventListener('click', () => this.toggleMute());
      this.btnPause.addEventListener('click', () => this.togglePause());
      this.btnResume.addEventListener('click', () => this.togglePause());
      this.btnRestart.addEventListener('click', () => this.resetGame());
      this.btnPlayAgain.addEventListener('click', () => this.resetGame());
    }

    handleContinuousInput(now) {
      if (this.isPaused || this.isGameOver || !this.currentPiece || this.isChoosingItem) return;

      if (this.dasActive.left && this.keys['ArrowLeft']) {
        if (now >= this.dasTimers.left) {
          this.moveLeft();
          this.dasTimers.left = now + this.arrRate;
        }
      }

      if (this.dasActive.right && this.keys['ArrowRight']) {
        if (now >= this.dasTimers.right) {
          this.moveRight();
          this.dasTimers.right = now + this.arrRate;
        }
      }

      if (this.dasActive.down && this.keys['ArrowDown']) {
        if (now >= this.dasTimers.down) {
          this.softDrop();
          this.dasTimers.down = now + (this.arrRate * 1.2);
        }
      }
    }

    togglePause() {
      if (this.isGameOver) return;
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        this.pauseOverlayEl.classList.remove('hidden');
        this.btnPause.innerHTML = '▶ CONTINUAR [P]';
      } else {
        this.pauseOverlayEl.classList.add('hidden');
        this.btnPause.innerHTML = '⏸ PAUSA [P]';
      }
    }

    toggleMute() {
      const muted = this.sound.toggleMute();
      this.soundIcon.textContent = muted ? '🔇' : '🔊';
      this.btnSound.classList.toggle('card-btn-danger', muted);
    }

    // ============================================================================
    // MOVIMENTAÇÃO & SRS ROTATION
    // ============================================================================
    checkCollision(piece, offsetX, offsetY, shape) {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const newX = offsetX + c;
            const newY = offsetY + r;

            // Limites laterais e inferior
            if (newX < 0 || newX >= COLS || newY >= ROWS) {
              return true;
            }
            // Colisão com blocos já fixados (se estiver dentro do grid)
            if (newY >= 0 && this.grid[newY][newX]) {
              return true;
            }
          }
        }
      }
      return false;
    }

    moveLeft() {
      if (!this.checkCollision(this.currentPiece, this.currentPiece.x - 1, this.currentPiece.y, this.currentPiece.shape)) {
        this.currentPiece.x--;
        this.sound.playMove();
        this.resetLockDelayIfMoved();
      }
    }

    moveRight() {
      if (!this.checkCollision(this.currentPiece, this.currentPiece.x + 1, this.currentPiece.y, this.currentPiece.shape)) {
        this.currentPiece.x++;
        this.sound.playMove();
        this.resetLockDelayIfMoved();
      }
    }

    softDrop() {
      if (!this.checkCollision(this.currentPiece, this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
        this.currentPiece.y++;
        this.score += 1;
        this.scoreValEl.textContent = this.score.toLocaleString();
      } else {
        this.isOnFloor = true;
      }
    }

    hardDrop() {
      let droppedCells = 0;
      while (!this.checkCollision(this.currentPiece, this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
        this.currentPiece.y++;
        droppedCells++;
      }
      this.score += droppedCells * 2;
      this.scoreValEl.textContent = this.score.toLocaleString();

      this.sound.playHardDrop();
      this.triggerSquash();
      this.particles.spawnHardDrop(this.currentPiece.x, this.currentPiece.y + this.currentPiece.shape.length, 8);
      this.lockPiece();
    }

    rotateMatrix(matrix, dir) {
      const N = matrix.length;
      const result = [];
      for (let r = 0; r < N; r++) {
        result.push(new Array(N).fill(0));
      }
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (dir === 1) {
            result[c][N - 1 - r] = matrix[r][c]; // Horário
          } else {
            result[N - 1 - c][r] = matrix[r][c]; // Anti-horário
          }
        }
      }
      return result;
    }

    rotatePiece(dir) {
      if (!this.currentPiece || this.currentPiece.type === 'O') return;

      const currentRot = this.currentPiece.rot;
      const nextRot = (currentRot + (dir === 1 ? 1 : 3)) % 4;
      const newShape = this.rotateMatrix(this.currentPiece.shape, dir);

      // Obter tabela de kicks SRS
      const kickKey = `${currentRot}->${nextRot}`;
      const kickTable = this.currentPiece.type === 'I' ? KICKS_I[kickKey] : KICKS_JLSTZ[kickKey];

      let kicked = false;
      if (kickTable) {
        for (let i = 0; i < kickTable.length; i++) {
          const [kx, ky] = kickTable[i];
          // Nota: no SRS o eixo Y cresce para cima, no nosso canvas Y cresce para baixo
          const testX = this.currentPiece.x + kx;
          const testY = this.currentPiece.y - ky;

          if (!this.checkCollision(this.currentPiece, testX, testY, newShape)) {
            this.currentPiece.x = testX;
            this.currentPiece.y = testY;
            this.currentPiece.shape = newShape;
            this.currentPiece.rot = nextRot;
            kicked = true;
            this.sound.playRotate();
            this.resetLockDelayIfMoved();
            break;
          }
        }
      }

      // Fallback simples caso não encontre na tabela
      if (!kicked && !this.checkCollision(this.currentPiece, this.currentPiece.x, this.currentPiece.y, newShape)) {
        this.currentPiece.shape = newShape;
        this.currentPiece.rot = nextRot;
        this.sound.playRotate();
        this.resetLockDelayIfMoved();
      }
    }

    resetLockDelayIfMoved() {
      if (this.isOnFloor) {
        this.lockDelayCounter = 0;
      }
    }

    doHold() {
      // Cartão Extra: +1 uso de Hold por peça por stack
      const maxHolds = 1 + this.getItemStacks('cartao_extra');
      if (this.holdCountForPiece >= maxHolds || this.isGameOver || this.isPaused || this.isChoosingItem) return;

      this.sound.playHold();
      const currentType = this.currentPiece.type;

      if (!this.holdPiece) {
        this.holdPiece = currentType;
        this.currentPiece = this.spawnPiece(this.nextQueue.shift());
        this.nextQueue.push(this.getNextPieceType());
      } else {
        const temp = this.holdPiece;
        this.holdPiece = currentType;
        this.currentPiece = this.spawnPiece(temp);
      }

      this.holdCountForPiece++;
      this.canHold = (this.holdCountForPiece < maxHolds);
      this.updateHoldUI();
      this.renderHold();
      this.renderNextQueue();
    }

    // Ghost Piece (Posição de sombra)
    getGhostY() {
      if (!this.currentPiece) return 0;
      let ghostY = this.currentPiece.y;
      while (!this.checkCollision(this.currentPiece, this.currentPiece.x, ghostY + 1, this.currentPiece.shape)) {
        ghostY++;
      }
      return ghostY;
    }

    // ============================================================================
    // FIXAÇÃO DE PEÇA & BALATRO SCORING / COMBOS
    // ============================================================================
    lockPiece() {
      if (!this.currentPiece) return;

      // Transferir peça para o grid
      for (let r = 0; r < this.currentPiece.shape.length; r++) {
        for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
          if (this.currentPiece.shape[r][c]) {
            const gy = this.currentPiece.y + r;
            const gx = this.currentPiece.x + c;
            if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS) {
              this.grid[gy][gx] = this.currentPiece.type;
            }
          }
        }
      }

      this.sound.playLand();
      this.triggerSquash();

      // Bomba Pequena: a cada 20 peças surge uma bomba que limpa área 3x3 ao pousar
      if (this.currentPiece.isBomb) {
        const shape = this.currentPiece.shape;
        const centerX = Math.floor(this.currentPiece.x + shape[0].length / 2);
        const centerY = Math.floor(this.currentPiece.y + shape.length / 2);

        let blocksCleared = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const targetY = centerY + dy;
            const targetX = centerX + dx;
            if (targetY >= 0 && targetY < ROWS && targetX >= 0 && targetX < COLS) {
              if (this.grid[targetY][targetX] !== null) {
                this.grid[targetY][targetX] = null;
                blocksCleared++;
              }
            }
          }
        }

        this.sound.playExplosion();
        this.particles.spawnExplosion(centerX, centerY);
        this.triggerShake(12);

        const bombPoints = (blocksCleared * 100 + 400) * this.level;
        this.score += bombPoints;
        this.scoreValEl.textContent = this.score.toLocaleString();
        this.spawnScorePopup(`💣 BOOM 3x3! +${bombPoints.toLocaleString()}`, Math.max(30, centerY * BLOCK_SIZE));
      }

      // Resetar usos de Hold para a nova peça
      this.holdCountForPiece = 0;
      this.canHold = true;
      this.updateHoldUI();

      // Checar linhas completadas
      const fullRows = [];
      for (let r = 0; r < ROWS; r++) {
        if (this.grid[r].every(cell => cell !== null)) {
          fullRows.push(r);
        }
      }

      if (fullRows.length > 0) {
        this.handleLineClears(fullRows);
      } else {
        // Ímã de Combo: tolerância de 1 peça sem limpar por stack
        if (this.combo > 0 && this.comboToleranceRemaining > 0) {
          this.comboToleranceRemaining--;
          const tolText = this.comboToleranceRemaining === 1 ? '1 restante' : `${this.comboToleranceRemaining} restantes`;
          this.spawnScorePopup(`🧲 ÍMÃ SALVOU O COMBO! (${tolText})`, Math.max(40, this.currentPiece.y * BLOCK_SIZE));
        } else {
          this.combo = 0;
          this.comboToleranceRemaining = 0;
          this.comboCountEl.textContent = '0';
          const goldBonus = this.getItemStacks('ficha_dourada') * 0.25;
          this.multValEl.textContent = `x${(1.0 + goldBonus).toFixed(1)}`;
          this.chipsValEl.textContent = '0';
        }
        this.advanceNextPiece();
      }
    }

    handleLineClears(rows) {
      this.clearingRows = rows;
      this.clearAnimTimer = this.clearAnimDuration;

      const linesCount = rows.length;
      this.lines += linesCount;
      this.combo++;
      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }

      // Recarrega tolerância do Ímã de Combo
      this.comboToleranceRemaining = this.getItemStacks('ima_combo');

      // Nível sobe a cada 10 linhas
      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        this.sound.playLevelUp();
      }

      // Multiplicador Balatro escalonado por combo + Ficha Dourada (+0,25 por stack)
      const multSteps = [1.0, 1.5, 2.0, 3.0, 4.0, 5.0];
      const baseMult = multSteps[Math.min(this.combo, multSteps.length - 1)];
      const goldBonus = this.getItemStacks('ficha_dourada') * 0.25;
      const mult = Number((baseMult + goldBonus).toFixed(2));

      // Pontuação Base de Fichas (Chips)
      const baseChipsTable = { 1: 100, 2: 300, 3: 500, 4: 800 };
      const baseChips = (baseChipsTable[linesCount] || 100) * this.level;

      // Back-to-Back (Tetris seguido)
      let b2bBonus = 1.0;
      let isB2BActive = false;
      if (linesCount === 4) {
        if (this.isBackToBack) {
          b2bBonus = 1.5;
          isB2BActive = true;
          this.b2bBadgeEl.classList.remove('hidden');
        } else {
          this.isBackToBack = true;
          this.b2bBadgeEl.classList.remove('hidden');
        }
      } else {
        this.isBackToBack = false;
        this.b2bBadgeEl.classList.add('hidden');
      }

      // Bônus do item Juros: +5% de score bônus por combo ativo por stack
      const jurosStacks = this.getItemStacks('juros');
      const jurosBonus = 1 + (this.combo * 0.05 * jurosStacks);

      const pointsEarned = Math.floor(baseChips * mult * b2bBonus * jurosBonus);
      this.score += pointsEarned;

      // Atualizar Recorde
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('tetro_balatro_highscore', this.highScore.toString());
        this.highScoreValEl.textContent = this.highScore.toLocaleString();
      }

      // Intensidade Balatro (+1 nível por stack do item Prisma)
      const prismaStacks = this.getItemStacks('prisma');
      const intensityGains = { 1: 1.8, 2: 3.2, 3: 4.8, 4: 7.2 };
      const gain = (intensityGains[linesCount] || 2) + (this.combo * 0.4) + (prismaStacks * 1.0);
      this.intensity = Math.min(10, this.intensity + gain);

      // Tremor de tela intensificado
      this.triggerShake(linesCount * 2.5 + (this.intensity * 0.6) + prismaStacks);

      // Áudio musical do combo
      this.sound.playLineClear(linesCount, this.combo);

      // Partículas em cada linha limpa (intensificadas pelo Prisma)
      const particleMultiplier = 1 + (prismaStacks * 0.5);
      rows.forEach(r => {
        this.particles.spawnLineClear(r, Math.round((20 + linesCount * 8) * particleMultiplier), this.intensity);
      });

      // Animações UI de Pulo Balatro
      this.bumpUIElements(baseChips, mult, pointsEarned);

      // Overlay de Combo (Único, animado, sem sobreposição, cores e tamanho escalonando)
      this.showComboOverlay(linesCount, this.combo, isB2BActive);

      // Popup de pontos nas linhas
      const popupY = (rows[0] * BLOCK_SIZE);
      const textPopup = `+${pointsEarned.toLocaleString()} (x${mult.toFixed(2)})`;
      this.spawnScorePopup(textPopup, popupY);

      if (jurosStacks > 0 && this.combo > 1) {
        this.spawnScorePopup(`📈 JUROS: +${Math.round(this.combo * 5 * jurosStacks)}% BÔNUS!`, Math.max(30, popupY - 26));
      }

      this.updateUI();
    }

    collapseClearedRows() {
      // Remove as linhas completas do grid
      for (const r of this.clearingRows) {
        this.grid.splice(r, 1);
        this.grid.unshift(new Array(COLS).fill(null));
      }
      this.clearingRows = [];
      this.canHold = true;
      this.holdCountForPiece = 0;
      this.updateHoldUI();

      // Sistema de itens estilo roguelike (a cada 15 linhas limpas no total)
      if (this.lines >= this.nextItemLinesTarget) {
        this.nextItemLinesTarget += 15;
        this.openItemChoiceModal();
      } else {
        this.advanceNextPiece();
      }
      this.updateItemsUI();
    }

    advanceNextPiece() {
      this.currentPiece = this.spawnPiece(this.nextQueue.shift());
      this.nextQueue.push(this.getNextPieceType());
      this.renderNextQueue();
    }

    triggerGameOver() {
      // Escudo: evita 1 Game Over por stack (limpa as 4 linhas do topo e consome o item)
      const escudoStacks = this.getItemStacks('escudo');
      if (escudoStacks > 0) {
        this.activeItems['escudo']--;
        if (this.activeItems['escudo'] <= 0) {
          delete this.activeItems['escudo'];
        }
        this.updateItemsUI();

        // Limpa as 4 linhas superiores
        for (let r = 0; r < 4; r++) {
          this.grid[r] = new Array(COLS).fill(null);
        }

        this.sound.playShieldRevive();
        for (let c = 0; c < COLS; c++) {
          this.particles.spawnLineClear(1, 15, 10, '#ffd700');
          this.particles.spawnLineClear(2, 15, 10, '#0bd4bd');
        }
        this.triggerShake(14);
        this.showShieldSavedOverlay();

        // Spawna uma nova peça no topo agora desimpedido
        this.currentPiece = this.spawnPiece(this.getNextPieceType());
        this.isGameOver = false;
        return true; // Salvou
      }

      this.clearComboOverlay();
      this.isGameOver = true;
      this.sound.playGameOver();

      this.finalScoreValEl.textContent = this.score.toLocaleString();
      this.finalLinesValEl.textContent = this.lines.toString();
      this.finalLevelValEl.textContent = this.level.toString();
      this.finalComboValEl.textContent = this.maxCombo.toString();

      if (this.score >= this.highScore && this.score > 0) {
        this.newRecordBadgeEl.classList.remove('hidden');
      }

      this.gameOverOverlayEl.classList.remove('hidden');
      return false;
    }

    // ============================================================================
    // SISTEMA DE OVERLAY DE COMBO & POPUPS
    // ============================================================================
    clearComboOverlay() {
      if (this.comboOverlayTimer) {
        clearTimeout(this.comboOverlayTimer);
        this.comboOverlayTimer = null;
      }
      if (this.currentComboOverlay) {
        this.currentComboOverlay.remove();
        this.currentComboOverlay = null;
      }
      // Remove qualquer banner órfão para garantir que nunca fique preso na tela
      const orphanBoxes = this.floatContainerEl.querySelectorAll('.combo-overlay-box');
      orphanBoxes.forEach(el => el.remove());
    }

    showComboOverlay(linesCount, combo, isBackToBack) {
      // 1. Evitar sobreposição: limpa qualquer overlay anterior antes de criar novo
      this.clearComboOverlay();

      // 2. Determinar texto da limpeza
      let lineType = 'SINGLE';
      if (linesCount === 2) lineType = 'DOUBLE';
      else if (linesCount === 3) lineType = 'TRIPLE';
      else if (linesCount === 4) lineType = 'TETRIS';

      // Formato: "TETRIS + 4X COMBO!", "TRIPLE + 3X COMBO!", "DOUBLE + 2X COMBO!"
      // Se não houver combo (só 1x): mostrar só o tipo: "TETRIS!", "SINGLE", "DOUBLE!", "TRIPLE!"
      let mainText = '';
      if (combo > 1) {
        mainText = `${lineType} + ${combo}X COMBO!`;
      } else {
        mainText = (linesCount === 1) ? 'SINGLE' : `${lineType}!`;
      }

      // 3. Determinar o tier para tamanho, cor e brilho que escalam
      let tierClass = 'combo-tier-1';
      if (combo >= 4) {
        tierClass = 'combo-tier-4';
      } else if (combo === 3) {
        tierClass = 'combo-tier-3';
      } else if (combo === 2) {
        tierClass = 'combo-tier-2';
      } else if (linesCount === 4) {
        tierClass = 'combo-tier-1 type-tetris';
      }

      // 4. Criar estrutura do overlay centralizado sobre o tabuleiro
      const box = document.createElement('div');
      box.className = 'combo-overlay-box';

      const titleEl = document.createElement('div');
      titleEl.className = `combo-title-text ${tierClass}`;
      titleEl.textContent = mainText;
      box.appendChild(titleEl);

      // Se Back-to-Back estiver ativo, adicionar segunda linha menor
      if (isBackToBack && linesCount === 4) {
        const b2bEl = document.createElement('div');
        b2bEl.className = 'combo-b2b-sub';
        b2bEl.textContent = 'BACK-TO-BACK!';
        box.appendChild(b2bEl);
      }

      this.floatContainerEl.appendChild(box);
      this.currentComboOverlay = box;

      // 5. Timer de desaparecimento em 1,2s (pop-in com escala, rotação e fade-out)
      this.comboOverlayTimer = setTimeout(() => {
        if (this.currentComboOverlay === box) {
          box.remove();
          this.currentComboOverlay = null;
          this.comboOverlayTimer = null;
        }
      }, 1200);
    }

    showShieldSavedOverlay() {
      this.clearComboOverlay();

      const box = document.createElement('div');
      box.className = 'combo-overlay-box';

      const titleEl = document.createElement('div');
      titleEl.className = 'shield-saved-banner';
      titleEl.textContent = '🛡️ ESCUDO SALVOU! (4 LINHAS LIMPAS)';
      box.appendChild(titleEl);

      this.floatContainerEl.appendChild(box);
      this.currentComboOverlay = box;

      this.comboOverlayTimer = setTimeout(() => {
        if (this.currentComboOverlay === box) {
          box.remove();
          this.currentComboOverlay = null;
          this.comboOverlayTimer = null;
        }
      }, 1400);
    }

    // ============================================================================
    // SISTEMA DE ITENS ROGUELIKE (A CADA 15 LINHAS)
    // ============================================================================
    getItemStacks(itemId) {
      return this.activeItems[itemId] || 0;
    }

    // Sorteio com pesos por raridade, permitindo itens já obtidos (para stackar)
    drawRandomItems(count = 3) {
      const allItemKeys = Object.keys(ROGUELIKE_ITEMS);
      const chosen = [];
      const pool = [...allItemKeys];

      for (let i = 0; i < count && pool.length > 0; i++) {
        const totalWeight = pool.reduce((sum, key) => sum + ROGUELIKE_ITEMS[key].weight, 0);
        let randomVal = Math.random() * totalWeight;
        let selectedKey = pool[0];

        for (let j = 0; j < pool.length; j++) {
          const key = pool[j];
          randomVal -= ROGUELIKE_ITEMS[key].weight;
          if (randomVal <= 0) {
            selectedKey = key;
            break;
          }
        }

        chosen.push(ROGUELIKE_ITEMS[selectedKey]);
        // Remove do pool desta mão para não ter duas cartas idênticas na mesma escolha de 3
        const indexInPool = pool.indexOf(selectedKey);
        if (indexInPool > -1) {
          pool.splice(indexInPool, 1);
        }
      }

      return chosen;
    }

    openItemChoiceModal() {
      this.isPaused = true;
      this.isChoosingItem = true;
      this.sound.playItemOffer();

      this.offeredItems = this.drawRandomItems(3);
      this.itemCardsGridEl.innerHTML = '';

      this.offeredItems.forEach((item, idx) => {
        const currentStacks = this.getItemStacks(item.id);
        const nextLevel = currentStacks + 1;

        const card = document.createElement('div');
        card.className = 'item-card';
        card.dataset.index = idx;

        card.innerHTML = `
          <div class="item-card-icon-box">${item.icon}</div>
          <div class="item-card-details">
            <div class="item-card-title-row">
              <span class="item-card-name">${item.name}</span>
              <span class="item-card-level">Nv.${nextLevel}</span>
              <span class="item-rarity-tag ${item.rarityClass}">${item.rarity}</span>
            </div>
            <div class="item-card-desc">${item.desc(nextLevel)}</div>
          </div>
          <div class="item-card-key">
            <kbd>${idx + 1}</kbd>
          </div>
        `;

        card.addEventListener('click', () => this.selectOfferedItem(idx));
        this.itemCardsGridEl.appendChild(card);
      });

      this.itemChoiceOverlayEl.classList.remove('hidden');
    }

    selectOfferedItem(idx) {
      if (!this.isChoosingItem || !this.offeredItems[idx]) return;

      const item = this.offeredItems[idx];
      this.activeItems[item.id] = (this.activeItems[item.id] || 0) + 1;
      const newLevel = this.activeItems[item.id];

      this.sound.playItemPick();
      this.itemChoiceOverlayEl.classList.add('hidden');
      this.isChoosingItem = false;
      this.isPaused = false;

      // Popup "+ITEM!"
      this.spawnItemPopup(item, newLevel);
      this.updateItemsUI();
      this.updateHoldUI();

      // Se ainda tiver marco de 15 linhas pendente
      if (this.lines >= this.nextItemLinesTarget) {
        this.nextItemLinesTarget += 15;
        this.openItemChoiceModal();
      } else {
        this.advanceNextPiece();
      }
    }

    spawnItemPopup(item, nextLevel) {
      const oldPopup = this.floatContainerEl.querySelector('.float-item-popup');
      if (oldPopup) oldPopup.remove();

      const popup = document.createElement('div');
      popup.className = 'float-item-popup';
      popup.innerHTML = `+ITEM! ${item.icon} ${item.name} (Nv.${nextLevel})`;
      this.floatContainerEl.appendChild(popup);
      setTimeout(() => popup.remove(), 1200);
    }

    updateItemsUI() {
      if (!this.itemsListTrayEl) return;
      this.itemsListTrayEl.innerHTML = '';
      const itemKeys = Object.keys(this.activeItems);
      let totalStacks = 0;

      if (itemKeys.length === 0) {
        this.itemsListTrayEl.innerHTML = '<div class="empty-items-text">Nenhum item ativo.<br>A cada 15 linhas escolha 1!</div>';
        if (this.itemCountValEl) this.itemCountValEl.textContent = '0';
      } else {
        itemKeys.forEach(id => {
          const stacks = this.activeItems[id];
          if (stacks <= 0) return;
          totalStacks += stacks;
          const def = ROGUELIKE_ITEMS[id];
          if (!def) return;

          const badge = document.createElement('div');
          badge.className = 'item-tray-badge';
          badge.title = `${def.name} (Nv.${stacks}): ${def.desc(stacks)}`;
          badge.innerHTML = `
            <span class="item-tray-icon">${def.icon}</span>
            <span class="item-tray-count">x${stacks}</span>
          `;
          this.itemsListTrayEl.appendChild(badge);
        });
        if (this.itemCountValEl) this.itemCountValEl.textContent = totalStacks.toString();
      }

      // Linhas restantes até o próximo item
      const linesRemaining = Math.max(0, this.nextItemLinesTarget - this.lines);
      if (this.nextItemLinesValEl) {
        this.nextItemLinesValEl.textContent = `${linesRemaining} linha${linesRemaining === 1 ? '' : 's'}`;
      }
    }

    updateHoldUI() {
      if (!this.holdSubtextEl) return;
      const maxHolds = 1 + this.getItemStacks('cartao_extra');
      if (maxHolds > 1) {
        const remaining = Math.max(0, maxHolds - this.holdCountForPiece);
        this.holdSubtextEl.textContent = `Hold (${remaining}/${maxHolds})`;
      } else {
        this.holdSubtextEl.textContent = 'Trocar Peça';
      }
    }

    // ============================================================================
    // EFEITOS VISUAIS "JUICY" (Popups, Shake, Squash, Intensidade)
    // ============================================================================
    triggerShake(magnitude) {
      this.shakeIntensity = Math.min(14, magnitude);
      this.shakeTimer = 250; // ms
    }

    triggerSquash() {
      this.boardSquashTimer = 180; // ms
    }

    spawnScorePopup(text, topPx) {
      const popup = document.createElement('div');
      popup.className = 'float-score-popup';
      popup.textContent = text;
      popup.style.top = `${Math.max(40, topPx)}px`;
      popup.style.left = '50%';
      this.floatContainerEl.appendChild(popup);
      setTimeout(() => popup.remove(), 1100);
    }

    bumpUIElements(chips, mult, total) {
      this.chipsValEl.textContent = chips.toLocaleString();
      this.multValEl.textContent = `x${mult}`;

      this.chipsBoxEl.classList.remove('mult-bump');
      this.multBoxEl.classList.remove('mult-bump');
      this.scoreValEl.classList.remove('score-bump');

      // Trigger reflow para reiniciar animação CSS
      void this.chipsBoxEl.offsetWidth;

      this.chipsBoxEl.classList.add('mult-bump');
      this.multBoxEl.classList.add('mult-bump');
      this.scoreValEl.classList.add('score-bump');
    }

    updateUI() {
      this.scoreValEl.textContent = this.score.toLocaleString();
      this.levelValEl.textContent = this.level.toString();
      this.linesValEl.textContent = this.lines.toString();
      this.comboCountEl.textContent = this.combo.toString();

      // Intensidade Balatro
      const intDisplay = this.intensity.toFixed(1);
      this.intensityNumEl.textContent = intDisplay;
      this.intensityBarFillEl.style.width = `${(this.intensity / 10) * 100}%`;

      let badgeText = 'CALMO';
      if (this.intensity >= 9.0) badgeText = '⚡ OVERDRIVE!';
      else if (this.intensity >= 6.0) badgeText = '🔥 FOGO / CAOS';
      else if (this.intensity >= 3.0) badgeText = '✨ ELEVADO';
      this.intensityBadgeEl.textContent = badgeText;
    }

    updateIntensityEffects(dt) {
      // Decaimento suave da intensidade ao longo do tempo (aprox 0.7 por seg)
      if (this.intensity > 0) {
        this.intensity = Math.max(0, this.intensity - (0.65 * (dt / 1000)));
        this.updateUI();
      }

      // Parâmetros para CSS variables
      // Velocidade do Swirl: de 18s (calmo) até 2.5s (intensidade 10)
      const swirlSpeed = Math.max(2.5, 18 - (this.intensity * 1.55)).toFixed(1) + 's';
      // Rotação de Hue: até 180deg
      const swirlHue = (this.intensity * 22).toFixed(0) + 'deg';
      // Aberração cromática: até 6px
      const chromaDist = this.intensity >= 6 ? ((this.intensity - 5) * 1.2).toFixed(1) + 'px' : '0px';

      document.documentElement.style.setProperty('--swirl-speed', swirlSpeed);
      document.documentElement.style.setProperty('--swirl-hue', swirlHue);
      document.documentElement.style.setProperty('--chroma-dist', chromaDist);
      document.documentElement.style.setProperty('--intensity', this.intensity.toFixed(2));

      // Overdrive Strobe (Nível 9-10)
      if (this.intensity >= 9.0) {
        document.body.classList.add('overdrive-strobe');
      } else {
        document.body.classList.remove('overdrive-strobe');
      }

      // Screen Shake
      if (this.shakeTimer > 0) {
        this.shakeTimer -= dt;
        const factor = this.shakeTimer / 250;
        const sx = (Math.random() - 0.5) * this.shakeIntensity * factor * 2;
        const sy = (Math.random() - 0.5) * this.shakeIntensity * factor * 2;
        const sRot = (Math.random() - 0.5) * (this.shakeIntensity * 0.2) * factor;

        document.documentElement.style.setProperty('--shake-x', `${sx.toFixed(1)}px`);
        document.documentElement.style.setProperty('--shake-y', `${sy.toFixed(1)}px`);
        document.documentElement.style.setProperty('--shake-rot', `${sRot.toFixed(2)}deg`);
      } else {
        document.documentElement.style.setProperty('--shake-x', '0px');
        document.documentElement.style.setProperty('--shake-y', '0px');
        document.documentElement.style.setProperty('--shake-rot', '0deg');
      }

      // Squash no Tabuleiro
      if (this.boardSquashTimer > 0) {
        this.boardSquashTimer -= dt;
        const p = this.boardSquashTimer / 180;
        const scaleVal = 1 - Math.sin(p * Math.PI) * 0.04;
        document.documentElement.style.setProperty('--board-scale', scaleVal.toFixed(3));
      } else {
        // Leve pulso de zoom com a intensidade
        const basePulse = 1 + (this.intensity * 0.012);
        document.documentElement.style.setProperty('--board-scale', basePulse.toFixed(3));
      }
    }

    // ============================================================================
    // RENDERIZAÇÃO NO CANVAS (Estilo Balatro: Fichas, Bevels, Gloss)
    // ============================================================================
    drawBlock(ctx, x, y, type, size, isGhost = false, isBomb = false) {
      const colors = isBomb
        ? { base: '#ea3c36', light: '#ffd700', dark: '#8f1b17', shadow: '#590e0b' }
        : (TETROMINO_COLORS[type] || TETROMINO_COLORS.I);
      const px = x * size;
      const py = y * size;

      if (isGhost) {
        // Peça Fantasma: Contorno translúcido com brilho
        ctx.save();
        ctx.fillStyle = colors.base;
        ctx.globalAlpha = isBomb ? 0.38 : 0.18;
        ctx.fillRect(px + 2, py + 2, size - 4, size - 4);

        ctx.strokeStyle = isBomb ? '#ffd700' : colors.light;
        ctx.lineWidth = isBomb ? 3 : 2;
        ctx.globalAlpha = isBomb ? 0.95 : 0.6;
        ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);

        if (isBomb && size >= 20) {
          ctx.font = `${Math.floor(size * 0.45)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('💣', px + size / 2, py + size / 2 + 1);
        }
        ctx.restore();
        return;
      }

      ctx.save();
      // 1. Sombra e Borda Externa Escura
      ctx.fillStyle = isBomb ? '#ffd700' : colors.shadow;
      ctx.fillRect(px, py, size, size);

      // 2. Cor Base Interna
      ctx.fillStyle = colors.base;
      ctx.fillRect(px + 2, py + 2, size - 4, size - 4);

      // 3. Bevel Superior / Esquerdo (Luz)
      ctx.fillStyle = colors.light;
      ctx.beginPath();
      ctx.moveTo(px + 2, py + 2);
      ctx.lineTo(px + size - 2, py + 2);
      ctx.lineTo(px + size - 5, py + 5);
      ctx.lineTo(px + 5, py + 5);
      ctx.lineTo(px + 5, py + size - 5);
      ctx.lineTo(px + 2, py + size - 2);
      ctx.closePath();
      ctx.fill();

      // 4. Bevel Inferior / Direito (Sombra)
      ctx.fillStyle = colors.dark;
      ctx.beginPath();
      ctx.moveTo(px + size - 2, py + 2);
      ctx.lineTo(px + size - 2, py + size - 2);
      ctx.lineTo(px + 2, py + size - 2);
      ctx.lineTo(px + 5, py + size - 5);
      ctx.lineTo(px + size - 5, py + size - 5);
      ctx.lineTo(px + size - 5, py + 5);
      ctx.closePath();
      ctx.fill();

      // 5. Brilho Pip Balatro (Gloss no canto superior esquerdo)
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.65;
      ctx.fillRect(px + 6, py + 6, 4, 4);

      // Se for peça bomba, desenha o emoji de bomba nítido no centro do bloco
      if (isBomb && size >= 20) {
        ctx.globalAlpha = 1;
        ctx.font = `${Math.floor(size * 0.52)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', px + size / 2, py + size / 2 + 1);
      }

      ctx.restore();
    }

    renderBoard() {
      // Limpar Canvas Principal
      this.mainCtx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);

      // Grid sutil no fundo
      this.mainCtx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      this.mainCtx.lineWidth = 1;
      for (let c = 1; c < COLS; c++) {
        this.mainCtx.beginPath();
        this.mainCtx.moveTo(c * BLOCK_SIZE, 0);
        this.mainCtx.lineTo(c * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        this.mainCtx.stroke();
      }
      for (let r = 1; r < ROWS; r++) {
        this.mainCtx.beginPath();
        this.mainCtx.moveTo(0, r * BLOCK_SIZE);
        this.mainCtx.lineTo(COLS * BLOCK_SIZE, r * BLOCK_SIZE);
        this.mainCtx.stroke();
      }

      // Desenhar Blocos Fixos do Grid
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (this.grid[r][c]) {
            this.drawBlock(this.mainCtx, c, r, this.grid[r][c], BLOCK_SIZE);
          }
        }
      }

      // Animação de Flash Branco nas linhas completadas
      if (this.clearingRows.length > 0) {
        const flashProgress = this.clearAnimTimer / this.clearAnimDuration;
        this.mainCtx.save();
        this.mainCtx.fillStyle = '#ffffff';
        this.mainCtx.globalAlpha = Math.max(0, flashProgress * 0.9);
        for (const r of this.clearingRows) {
          this.mainCtx.fillRect(0, r * BLOCK_SIZE, COLS * BLOCK_SIZE, BLOCK_SIZE);
        }
        this.mainCtx.restore();
      }

      // Desenhar Peça Fantasma (Ghost)
      if (this.currentPiece && this.clearingRows.length === 0) {
        const ghostY = this.getGhostY();
        const isBomb = Boolean(this.currentPiece.isBomb);
        for (let r = 0; r < this.currentPiece.shape.length; r++) {
          for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
            if (this.currentPiece.shape[r][c]) {
              const gy = ghostY + r;
              const gx = this.currentPiece.x + c;
              if (gy >= 0) {
                this.drawBlock(this.mainCtx, gx, gy, this.currentPiece.type, BLOCK_SIZE, true, isBomb);
              }
            }
          }
        }

        // Desenhar Peça Atual Ativa
        for (let r = 0; r < this.currentPiece.shape.length; r++) {
          for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
            if (this.currentPiece.shape[r][c]) {
              const py = this.currentPiece.y + r;
              const px = this.currentPiece.x + c;
              if (py >= 0) {
                this.drawBlock(this.mainCtx, px, py, this.currentPiece.type, BLOCK_SIZE, false, isBomb);
              }
            }
          }
        }
      }

      // Renderizar Partículas
      this.particles.updateAndDraw();
    }

    // Renderizar Miniatura da Peça no Hold
    renderHold() {
      this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
      if (!this.holdPiece) return;

      const shape = SHAPES[this.holdPiece];
      const miniSize = 22;
      const pieceW = shape[0].length * miniSize;
      const pieceH = shape.length * miniSize;
      const startX = Math.floor((this.holdCanvas.width - pieceW) / 2 / miniSize);
      const startY = Math.floor((this.holdCanvas.height - pieceH) / 2 / miniSize);

      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            this.drawBlock(this.holdCtx, startX + c, startY + r, this.holdPiece, miniSize);
          }
        }
      }
    }

    // Renderizar Miniaturas das Próximas 3 Peças
    renderNextQueue() {
      for (let i = 0; i < 3; i++) {
        const ctx = this.nextCtxs[i];
        const canvas = this.nextCanvases[i];
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const type = this.nextQueue[i];
        if (!type) continue;

        const shape = SHAPES[type];
        const miniSize = 19;
        const pieceW = shape[0].length * miniSize;
        const pieceH = shape.length * miniSize;
        const startX = Math.floor((canvas.width - pieceW) / 2 / miniSize);
        const startY = Math.floor((canvas.height - pieceH) / 2 / miniSize);

        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
              this.drawBlock(ctx, startX + c, startY + r, type, miniSize);
            }
          }
        }
      }
    }

    // ============================================================================
    // LOOP PRINCIPAL DE ANIMAÇÃO & GRAVIDADE
    // ============================================================================
    startLoop() {
      const step = now => {
        if (!this.lastTime) this.lastTime = now;
        const dt = Math.min(now - this.lastTime, 100); // Limite de 100ms contra lag spikes
        this.lastTime = now;

        if (!this.isPaused && !this.isGameOver) {
          this.handleContinuousInput(now);
          this.updateGame(dt);
        }

        this.updateIntensityEffects(dt);
        this.renderBoard();

        requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    }

    updateGame(dt) {
      // Se estamos em animação de limpar linha, aguarda finalizar o flash
      if (this.clearingRows.length > 0) {
        this.clearAnimTimer -= dt;
        if (this.clearAnimTimer <= 0) {
          this.collapseClearedRows();
        }
        return;
      }

      if (!this.currentPiece) return;

      // Velocidade de Queda baseada no Nível
      // Nível 1: ~750ms -> Nível 10: ~120ms
      // Relógio de Areia: a queda das peças fica 8% mais lenta por stack
      const baseDelay = Math.max(80, Math.floor(780 * Math.pow(0.86, this.level - 1)));
      const sandStacks = this.getItemStacks('relogio_areia');
      const gravityDelay = Math.round(baseDelay * (1 + sandStacks * 0.08));

      this.dropCounter += dt;
      if (this.dropCounter >= gravityDelay) {
        this.dropCounter = 0;
        // Tentativa de queda normal
        if (!this.checkCollision(this.currentPiece, this.currentPiece.x, this.currentPiece.y + 1, this.currentPiece.shape)) {
          this.currentPiece.y++;
          this.isOnFloor = false;
        } else {
          this.isOnFloor = true;
        }
      }

      // Trava no chão com Lock Delay de 500ms
      if (this.isOnFloor) {
        this.lockDelayCounter += dt;
        if (this.lockDelayCounter >= this.lockDelayLimit) {
          this.lockDelayCounter = 0;
          this.isOnFloor = false;
          this.lockPiece();
        }
      } else {
        this.lockDelayCounter = 0;
      }
    }
  }

  // Iniciar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new TetrisGame());
  } else {
    new TetrisGame();
  }

})();
