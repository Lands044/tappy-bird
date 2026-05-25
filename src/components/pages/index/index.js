import ConfettiAnimation from './confetti.js';

class SlotMachine {


	// Показ CTA popup
	showCTA() {
		this.buttonsWrap.classList.add('hidden');

		setTimeout(() => {
			this.popup.classList.add('show');

			// Запускаємо анімацію конфеті
			if (!this.confettiAnimation) {
				this.confettiAnimation = new ConfettiAnimation(this.popup);
			}
		}, 1500);
	}
}

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
	new SlotMachine();
});
