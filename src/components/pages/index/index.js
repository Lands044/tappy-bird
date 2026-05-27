import ConfettiAnimation from './confetti.js';

const BET_OPTIONS = [0.5, 1, 2, 3, 6, 10, 20, 50];
const SPIN_INTERVAL_MS = 800;
const INITIAL_BALANCE = 1500;

class TappyBird {
	constructor() {
		this.betIndex = BET_OPTIONS.indexOf(6);
		this.balance = INITIAL_BALANCE;
		this.lastWin = 0;
		this.spinning = false;
		this.clickCount = 0;
		this.autoPlaying = false;
		this.confettiAnimation = null;

		this.elBalance   = document.getElementById('balance');
		this.elBet       = document.getElementById('bet');
		this.elLastWin   = document.getElementById('lastWin');
		this.elBetMinus  = document.getElementById('betMinus');
		this.elBetPlus   = document.getElementById('betPlus');
		this.elSpin      = document.getElementById('spinBtn');
		this.elSound     = document.getElementById('soundBtn');
		this.elAuto      = document.getElementById('autoBtn');
		this.elRefresh   = document.getElementById('refreshBtn');
		this.elInfo      = document.getElementById('infoBtn');
		this.elFreeSpins = document.getElementById('freeSpinsBtn');
		this.elControls  = document.getElementById('gameControls');
		this.elBird      = document.getElementById('bird');
		this.popup       = document.querySelector('.popup');

		this.elJackpotMinor = document.getElementById('jackpotMinor');
		this.elJackpotGrand = document.getElementById('jackpotGrand');
		this.elJackpotMajor = document.getElementById('jackpotMajor');

		this.soundOn = true;
		this.audioCtx = null;

		this.elInfo.disabled = true;
		this.elInfo.style.opacity = '0.35';
		this.elInfo.style.cursor = 'default';

		this._bindEvents();
		this._tickJackpots();
		this._render();
	}

	_getAudioCtx() {
		if (!this.audioCtx) {
			this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
		}
		return this.audioCtx;
	}

	// Характерне "куркання" голуба
	_playCoo() {
		if (!this.soundOn) return;
		const ctx = this._getAudioCtx();
		const t = ctx.currentTime;

		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(ctx.destination);

		osc.type = 'sine';
		// Низька нота що плавно піднімається — характерне "у-у-ур"
		osc.frequency.setValueAtTime(220, t);
		osc.frequency.linearRampToValueAtTime(310, t + 0.08);
		osc.frequency.linearRampToValueAtTime(260, t + 0.18);
		osc.frequency.linearRampToValueAtTime(340, t + 0.28);
		osc.frequency.linearRampToValueAtTime(280, t + 0.42);

		gain.gain.setValueAtTime(0, t);
		gain.gain.linearRampToValueAtTime(0.35, t + 0.04);
		gain.gain.linearRampToValueAtTime(0.3, t + 0.2);
		gain.gain.linearRampToValueAtTime(0.0, t + 0.5);

		osc.start(t);
		osc.stop(t + 0.5);
	}

	// Звук виграшу — піднімальний акорд
	_playWin() {
		if (!this.soundOn) return;
		const ctx = this._getAudioCtx();
		const notes = [523, 659, 784, 1047];
		notes.forEach((freq, i) => {
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			const t = ctx.currentTime + i * 0.08;
			osc.type = 'triangle';
			osc.frequency.setValueAtTime(freq, t);
			gain.gain.setValueAtTime(0.25, t);
			gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
			osc.start(t);
			osc.stop(t + 0.4);
		});
	}

	// Клік на ставку — короткий "тік"
	_playTick() {
		if (!this.soundOn) return;
		const ctx = this._getAudioCtx();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.connect(gain);
		gain.connect(ctx.destination);
		const t = ctx.currentTime;
		osc.type = 'square';
		osc.frequency.setValueAtTime(800, t);
		gain.gain.setValueAtTime(0.15, t);
		gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
		osc.start(t);
		osc.stop(t + 0.06);
	}

	_tap(el, fn) {
		let touched = false;
		el.addEventListener('touchstart', (e) => {
			e.preventDefault();
			touched = true;
		}, { passive: false });
		el.addEventListener('touchend', (e) => {
			e.preventDefault();
			if (touched) { touched = false; fn(); }
		}, { passive: false });
		el.addEventListener('click', () => {
			if (touched) return;
			fn();
		});
	}

	_bindEvents() {
		this._tap(this.elBetMinus,  () => this._changeBet(-1));
		this._tap(this.elBetPlus,   () => this._changeBet(1));
		this._tap(this.elSpin,      () => this._spin());
		this._tap(this.elBird,      () => this._spin());
		this._tap(this.elFreeSpins, () => this._buyFreeSpins());
		this._tap(this.elSound,     () => this._toggleSound());
		this._tap(this.elAuto,      () => this._autoPlay());
		this._tap(this.elRefresh,   () => this._resetGame());
	}

	_changeBet(dir) {
		this.betIndex = Math.max(0, Math.min(BET_OPTIONS.length - 1, this.betIndex + dir));
		this._playTick();
		this._render();
	}

	_spin() {
		if (this.spinning) return;

		const bet = BET_OPTIONS[this.betIndex];
		if (this.balance < bet) return;

		this.spinning = true;
		this.balance -= bet;
		this.elSpin.disabled = true;
		this.elBetMinus.disabled = true;
		this.elBetPlus.disabled = true;

		this.clickCount++;
		this._playCoo();
		this._animateBird();
		this._render();

		setTimeout(() => {
			if (this.clickCount === 2) {
				const win = +(bet * 0.2).toFixed(2);
				this.lastWin = win;
				this.balance += win;
				this._playWin();
				this._spawnWinLabel(`+${win.toFixed(2)}`);
			} else if (this.clickCount >= 3) {
				const win = +(bet * 0.8).toFixed(2);
				this.lastWin = win;
				this.balance += win;
				this._playWin();
				this._spawnWinLabel(`+${win.toFixed(2)}`);
				this.clickCount = 0;
				this.autoPlaying = false;
				this.spinning = false;
				this.elSpin.disabled = false;
				this.elBetMinus.disabled = false;
				this.elBetPlus.disabled = false;
				this._setAutoActive(false);
				this._render();
				this._showCTA();
				return;
			}

			this.spinning = false;
			this.elSpin.disabled = false;
			this.elBetMinus.disabled = false;
			this.elBetPlus.disabled = false;
			this._render();
		}, SPIN_INTERVAL_MS);
	}

	_autoPlay() {
		if (this.autoPlaying || this.spinning) return;
		this.autoPlaying = true;
		this._setAutoActive(true);

		const doSpin = (count) => {
			if (count === 0) return;
			this._spin();
			// Чекаємо завершення поточного спіну + невелика пауза між кліками
			setTimeout(() => doSpin(count - 1), SPIN_INTERVAL_MS + 300);
		};

		// Запускаємо 3 кліки з затримкою
		doSpin(3);
	}

	_setAutoActive(on) {
		this.elAuto.style.background = on ? '#3a8c1a' : '';
		this.elAuto.style.borderColor = on ? '#7acc30' : '';
	}

	_resetGame() {
		this.balance = INITIAL_BALANCE;
		this.lastWin = 0;
		this.clickCount = 0;
		this.spinning = false;
		this.autoPlaying = false;

		this.elSpin.disabled = false;
		this.elBetMinus.disabled = false;
		this.elBetPlus.disabled = false;
		this.elControls.style.pointerEvents = '';
		this.elControls.style.opacity = '';

		this.popup.classList.remove('show');
		if (this.confettiAnimation) {
			this.confettiAnimation = null;
		}

		this._setAutoActive(false);
		this._playTick();
		this._render();
	}

	_spawnWinLabel(text) {
		const scene = this.elBird.parentElement;
		const birdRect = this.elBird.getBoundingClientRect();
		const sceneRect = scene.getBoundingClientRect();

		const el = document.createElement('div');
		el.className = 'win-label';
		el.textContent = text;
		el.style.left = (birdRect.left - sceneRect.left + birdRect.width / 2) + 'px';
		el.style.top  = (birdRect.top  - sceneRect.top) + 'px';

		scene.appendChild(el);
		setTimeout(() => el.remove(), 1200);
	}

	_animateBird() {
		const spin = this.clickCount;

		if (spin === 2) {
			this.elBird.classList.add('game__bird--drunk');
			setTimeout(() => this.elBird.classList.remove('game__bird--drunk'), 1100);
			this._spawnDrunkStars();
			this._playDrunk();
		} else if (spin >= 3) {
			this.elBird.classList.add('game__bird--zap');
			setTimeout(() => this.elBird.classList.remove('game__bird--zap'), 900);
			this._spawnLightning();
			this._playZap();
		} else {
			this.elBird.classList.add('game__bird--spin');
			setTimeout(() => this.elBird.classList.remove('game__bird--spin'), SPIN_INTERVAL_MS);
		}

		this._spawnFeathers();
	}

	_spawnDrunkStars() {
		const scene = this.elBird.parentElement;
		const birdRect = this.elBird.getBoundingClientRect();
		const sceneRect = scene.getBoundingClientRect();
		const cx = birdRect.left - sceneRect.left + birdRect.width / 2;
		const cy = birdRect.top  - sceneRect.top  + birdRect.height * 0.18;

		const COUNT = 5;
		const EMOJIS = ['⭐', '✨', '💫', '⭐', '✨'];
		const radius = 52;

		for (let i = 0; i < COUNT; i++) {
			const el = document.createElement('div');
			el.className = 'drunk-star';
			el.textContent = EMOJIS[i];

			const startAngle = (i / COUNT) * 360;
			const spinDeg = startAngle + (i % 2 === 0 ? 360 : -360);
			el.style.left = cx + 'px';
			el.style.top  = cy + 'px';
			el.style.setProperty('--r',     radius + 'px');
			el.style.setProperty('--ox',    '0px');
			el.style.setProperty('--oy',    '0px');
			el.style.setProperty('--sz',    (12 + i * 2) + 'px');
			el.style.setProperty('--dur',   '1.1s');
			el.style.setProperty('--delay', (i * 80) + 'ms');
			el.style.setProperty('--spin',  spinDeg + 'deg');
			el.style.transformOrigin = '0 0';
			el.style.transform = `rotate(${startAngle}deg) translateX(${radius}px)`;

			scene.appendChild(el);
			setTimeout(() => el.remove(), 1300);
		}
	}

	_playDrunk() {
		if (!this.soundOn) return;
		const ctx = this._getAudioCtx();
		const t = ctx.currentTime;

		// Wobbly wobble — two sine waves slightly offset in pitch
		[220, 226].forEach((freq, i) => {
			const osc  = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.type = 'sine';
			osc.frequency.setValueAtTime(freq, t);
			osc.frequency.linearRampToValueAtTime(freq * 1.4, t + 0.15);
			osc.frequency.linearRampToValueAtTime(freq * 0.85, t + 0.45);
			osc.frequency.linearRampToValueAtTime(freq, t + 0.7);
			gain.gain.setValueAtTime(0, t);
			gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
			gain.gain.linearRampToValueAtTime(0.15, t + 0.4);
			gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
			osc.start(t + i * 0.02);
			osc.stop(t + 0.85);
		});
	}

	_playZap() {
		if (!this.soundOn) return;
		const ctx = this._getAudioCtx();
		const t = ctx.currentTime;

		const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
		const data = buf.getChannelData(0);
		for (let i = 0; i < data.length; i++) {
			data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5);
		}
		const src = ctx.createBufferSource();
		src.buffer = buf;

		const filter = ctx.createBiquadFilter();
		filter.type = 'bandpass';
		filter.frequency.setValueAtTime(1800, t);
		filter.frequency.linearRampToValueAtTime(400, t + 0.3);
		filter.Q.setValueAtTime(0.8, t);

		const gain = ctx.createGain();
		gain.gain.setValueAtTime(0.6, t);
		gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

		src.connect(filter);
		filter.connect(gain);
		gain.connect(ctx.destination);
		src.start(t);
	}

	_spawnLightning() {
		const scene = this.elBird.parentElement;
		const birdRect = this.elBird.getBoundingClientRect();
		const sceneRect = scene.getBoundingClientRect();
		const cx = birdRect.left - sceneRect.left + birdRect.width / 2;
		const birdTop = birdRect.top - sceneRect.top;

		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.classList.add('lightning');
		const boltH = birdTop + 20;
		svg.setAttribute('width', '48');
		svg.setAttribute('height', String(boltH));
		svg.setAttribute('viewBox', `0 0 48 ${boltH}`);
		svg.style.top = '0px';
		svg.style.left = (cx - 24) + 'px';
		svg.style.transform = 'none';

		const pts = `28,0 16,${Math.round(boltH * 0.42)} 30,${Math.round(boltH * 0.42)} 18,${boltH}`;
		const glow = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
		glow.setAttribute('points', pts);
		glow.setAttribute('fill', 'none');
		glow.setAttribute('stroke', 'rgba(200,220,255,0.5)');
		glow.setAttribute('stroke-width', '10');
		glow.setAttribute('stroke-linejoin', 'round');
		glow.setAttribute('stroke-linecap', 'round');

		const bolt = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
		bolt.setAttribute('points', pts);
		bolt.setAttribute('fill', 'none');
		bolt.setAttribute('stroke', '#ffffaa');
		bolt.setAttribute('stroke-width', '3');
		bolt.setAttribute('stroke-linejoin', 'round');
		bolt.setAttribute('stroke-linecap', 'round');

		svg.appendChild(glow);
		svg.appendChild(bolt);
		scene.appendChild(svg);
		setTimeout(() => svg.remove(), 900);
	}

	_spawnFeathers() {
		const COLORS = ['#3a8c1a', '#1a5c0a', '#5ab020', '#e8a800', '#2d7010', '#7acc30'];
		const scene = this.elBird.parentElement;
		const birdRect = this.elBird.getBoundingClientRect();
		const sceneRect = scene.getBoundingClientRect();

		const cx = birdRect.left - sceneRect.left + birdRect.width / 2;
		const cy = birdRect.top  - sceneRect.top  + birdRect.height / 2;

		for (let i = 0; i < 14; i++) {
			const el = document.createElement('div');
			el.className = 'feather';
			el.style.setProperty('--fc', COLORS[i % COLORS.length]);

			const angle = (Math.random() * 360) * (Math.PI / 180);
			const dist  = 60 + Math.random() * 80;
			el.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
			el.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
			el.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
			el.style.setProperty('--delay', `${Math.random() * 80}ms`);

			el.style.left = cx + 'px';
			el.style.top  = cy + 'px';

			scene.appendChild(el);
			setTimeout(() => el.remove(), 700);
		}
	}

	_buyFreeSpins() {
		this._playTick();
		this._showCTA();
	}

	_toggleSound() {
		this.soundOn = !this.soundOn;
		this.elSound.style.opacity = this.soundOn ? '1' : '0.4';
	}

	_tickJackpots() {
		setInterval(() => {
			const minor = parseFloat(this.elJackpotMinor.textContent) + (Math.random() * 0.03);
			const grand = parseFloat(this.elJackpotGrand.textContent) + (Math.random() * 0.12);
			const major = parseFloat(this.elJackpotMajor.textContent) + (Math.random() * 0.05);
			this.elJackpotMinor.textContent = minor.toFixed(2);
			this.elJackpotGrand.textContent = grand.toFixed(2);
			this.elJackpotMajor.textContent = major.toFixed(2);
		}, 1500);
	}

	_render() {
		const bet = BET_OPTIONS[this.betIndex];
		this.elBalance.textContent  = `€${this._fmt(this.balance)}`;
		this.elBet.textContent      = `€${bet.toFixed(2)}`;
		this.elLastWin.textContent  = `€${this._fmt(this.lastWin)}`;
		this.elBetMinus.disabled    = this.betIndex === 0 || this.spinning;
		this.elBetPlus.disabled     = this.betIndex === BET_OPTIONS.length - 1 || this.spinning;
	}

	_fmt(val) {
		return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	_showCTA() {
		this.elControls.style.pointerEvents = 'none';
		this.elControls.style.opacity = '0.5';

		setTimeout(() => {
			this.popup.classList.add('show');
			if (!this.confettiAnimation) {
				this.confettiAnimation = new ConfettiAnimation(this.popup);
			}
		}, 600);
	}
}

document.addEventListener('DOMContentLoaded', () => {
	new TappyBird();
});
