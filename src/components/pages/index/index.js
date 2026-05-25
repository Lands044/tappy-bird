import ConfettiAnimation from './confetti.js';

const BET_OPTIONS = [0.5, 1, 2, 3, 6, 10, 20, 50];
const SPIN_INTERVAL_MS = 800;

class TappyBird {
	constructor() {
		this.betIndex = BET_OPTIONS.indexOf(6);
		this.balance = 100000;
		this.lastWin = 0;
		this.spinning = false;
		this.clickCount = 0;
		this.confettiAnimation = null;

		this.elBalance  = document.getElementById('balance');
		this.elBet      = document.getElementById('bet');
		this.elLastWin  = document.getElementById('lastWin');
		this.elBetMinus = document.getElementById('betMinus');
		this.elBetPlus  = document.getElementById('betPlus');
		this.elSpin     = document.getElementById('spinBtn');
		this.elSound    = document.getElementById('soundBtn');
		this.elFreeSpins = document.getElementById('freeSpinsBtn');
		this.elControls = document.getElementById('gameControls');
		this.elBird     = document.getElementById('bird');
		this.popup      = document.querySelector('.popup');

		this.elJackpotMinor = document.getElementById('jackpotMinor');
		this.elJackpotGrand = document.getElementById('jackpotGrand');
		this.elJackpotMajor = document.getElementById('jackpotMajor');

		this.soundOn = true;
		this.spinSound   = new Audio('@assets/sound/spin.mp3');
		this.winSound    = new Audio('@assets/sound/win.mp3');
		this.selectSound = new Audio('@assets/sound/select.ogg');

		this._bindEvents();
		this._tickJackpots();
		this._render();
	}

	_bindEvents() {
		this.elBetMinus.addEventListener('click', () => this._changeBet(-1));
		this.elBetPlus.addEventListener('click',  () => this._changeBet(1));
		this.elSpin.addEventListener('click', () => this._spin());
		this.elBird.addEventListener('click', () => this._spin());
		this.elFreeSpins.addEventListener('click', () => this._buyFreeSpins());
		this.elSound.addEventListener('click', () => this._toggleSound());
	}

	_changeBet(dir) {
		this.betIndex = Math.max(0, Math.min(BET_OPTIONS.length - 1, this.betIndex + dir));
		this._playSound(this.selectSound);
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

		this._playSound(this.spinSound);
		this._animateBird();
		this._render();

		this.clickCount++;

		setTimeout(() => {
			if (this.clickCount === 2) {
				const win = +(bet * 0.2).toFixed(2);
				this.lastWin = win;
				this.balance += win;
				this._playSound(this.winSound);
				this._spawnWinLabel(`+${win.toFixed(2)}`);
			} else if (this.clickCount >= 3) {
				const win = +(bet * 0.8).toFixed(2);
				this.lastWin = win;
				this.balance += win;
				this._playSound(this.winSound);
				this._spawnWinLabel(`+${win.toFixed(2)}`);
				this.clickCount = 0;
				this.spinning = false;
				this.elSpin.disabled = false;
				this.elBetMinus.disabled = false;
				this.elBetPlus.disabled = false;
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
		this._playSound(this.selectSound);
		this._showCTA();
	}

	_toggleSound() {
		this.soundOn = !this.soundOn;
		this.elSound.style.opacity = this.soundOn ? '1' : '0.4';
	}

	_playSound(audio) {
		if (!this.soundOn) return;
		try {
			audio.currentTime = 0;
			audio.play().catch(() => {});
		} catch {}
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
