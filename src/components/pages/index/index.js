import ConfettiAnimation from './confetti.js';

const BET_OPTIONS = [0.5, 1, 2, 3, 6, 10, 20, 50];
const SPIN_INTERVAL_MS = 800;

class TappyBird {
	constructor() {
		this.betIndex = BET_OPTIONS.indexOf(6);
		this.balance = 100000;
		this.lastWin = 90;
		this.spinning = false;
		this.spinsLeft = 0;
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

		setTimeout(() => {
			const win = this._calcWin(bet);
			this.lastWin = win;
			if (win > 0) {
				this.balance += win;
				this._playSound(this.winSound);
			}

			this.spinning = false;
			this.elSpin.disabled = false;
			this.elBetMinus.disabled = false;
			this.elBetPlus.disabled = false;
			this._render();

			if (this._shouldShowCTA()) {
				this._showCTA();
			}
		}, SPIN_INTERVAL_MS);
	}

	_calcWin(bet) {
		const roll = Math.random();
		if (roll < 0.08)  return +(bet * 15).toFixed(2);
		if (roll < 0.25)  return +(bet * 5).toFixed(2);
		if (roll < 0.45)  return +(bet * 2).toFixed(2);
		return 0;
	}

	_shouldShowCTA() {
		return Math.random() < 0.25;
	}

	_animateBird() {
		this.elBird.classList.add('game__bird--spin');
		setTimeout(() => this.elBird.classList.remove('game__bird--spin'), SPIN_INTERVAL_MS);
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
