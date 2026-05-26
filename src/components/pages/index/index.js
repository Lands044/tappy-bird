import ConfettiAnimation from './confetti.js';

const BET_OPTIONS = [0.5, 1, 2, 3, 6, 10, 20, 50];
const SPIN_INTERVAL_MS = 800;
const INITIAL_BALANCE = 100000;

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

	_bindEvents() {
		this.elBetMinus.addEventListener('click', () => this._changeBet(-1));
		this.elBetPlus.addEventListener('click',  () => this._changeBet(1));
		this.elSpin.addEventListener('click', () => this._spin());
		this.elBird.addEventListener('click', () => this._spin());
		this.elFreeSpins.addEventListener('click', () => this._buyFreeSpins());
		this.elSound.addEventListener('click', () => this._toggleSound());
		this.elAuto.addEventListener('click', () => this._autoPlay());
		this.elRefresh.addEventListener('click', () => this._resetGame());
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

		this._playCoo();
		this._animateBird();
		this._render();

		this.clickCount++;

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
		this.elBird.classList.add('game__bird--spin');
		setTimeout(() => this.elBird.classList.remove('game__bird--spin'), SPIN_INTERVAL_MS);
		this._spawnFeathers();
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
