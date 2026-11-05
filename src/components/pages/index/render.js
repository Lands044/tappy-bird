import { imageUrl } from '@js/config/assets.js'

// textContent rather than innerText: these are plain labels, and innerText is
// rendering-dependent (it reads back empty inside a hidden element).
const setText = (selector, value) => {
	const element = document.querySelector(selector)
	if (element && typeof value === 'string') element.textContent = value
}

const setHtml = (selector, value) => {
	const element = document.querySelector(selector)
	if (element && typeof value === 'string') element.innerHTML = value
}

const setImage = (selector, value, fallbackKey) => {
	const element = document.querySelector(selector)
	if (element) element.src = imageUrl(value, fallbackKey)
}

// Only the image is overridden — position/size/repeat stay in index.scss.
const setBackground = (selector, value, fallbackKey) => {
	const element = document.querySelector(selector)
	if (element) element.style.backgroundImage = `url('${imageUrl(value, fallbackKey)}')`
}

/**
 * Applies the static parts of the config to the page: art, labels, popup, CTA.
 * Game state (balance, bet, last win, jackpot values) is written by the
 * TappyBird class in index.js, since it re-renders those on every tap.
 *
 * Safe to call repeatedly — this is the function the dev watcher re-runs on
 * every config.json edit.
 */
export function renderLanding(config) {
	const { texts, cta, assets } = config

	setBackground('.page', assets.background, 'bg')
	setBackground('.game__bg', assets.backgroundMove, 'bg-move')
	setImage('.game__bird-img', assets.bird, 'birdie')

	setText('.jackpot--minor .jackpot__label', texts.jackpotMinor)
	setText('.jackpot--grand .jackpot__label', texts.jackpotGrand)
	setText('.jackpot--major .jackpot__label', texts.jackpotMajor)

	setText('#balanceLabel', texts.balanceLabel)
	setText('#betLabel', texts.betLabel)
	setText('#lastWinLabel', texts.lastWinLabel)

	setText('#spinBtn', texts.actionButton)
	setHtml('#freeSpinsLabel', texts.freeSpinsButton)

	setText('.popup__title', texts.popupTitle)
	setText('.popup__text', texts.popupText)
	setText('.cta-button', texts.ctaButton)
	setText('.rotate-overlay__content p', texts.rotateNotice)

	const ctaButton = document.querySelector('.cta-button')
	if (ctaButton) {
		ctaButton.href = cta.url
		ctaButton.target = cta.target
	}
}
