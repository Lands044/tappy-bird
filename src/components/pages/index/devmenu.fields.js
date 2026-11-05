import { DEFAULT_CONFIG } from '@js/config/game.defaults.js'

// Game-specific devmenu field groups, concatenated with CORE_FIELDS (texts/CTA/
// sound) in index.js. See src/js/config/devmenu.js in the core kit for the field
// shape ({ path, label, type, min/max/step, hint }).
//
// One field pair per scripted tap, count derived from DEFAULT_CONFIG.game.taps.
// Adding/removing taps is done in config.json by hand.
const tapFields = () => DEFAULT_CONFIG.game.taps.map((tap, i) => [
	{ path: `game.taps.${i}.effect`, label: `Тап #${i + 1}: ефект`, type: 'text',
		hint: i === 0 ? 'spin / drunk / zap' : undefined },
	{ path: `game.taps.${i}.winMultiplier`, label: `Тап #${i + 1}: множник виграшу`, type: 'number', min: 0, step: 0.1 }
]).flat()

export const GAME_FIELDS = [
	['Баланс і ставки', [
		{ path: 'game.currency', label: 'Валюта', type: 'text' },
		{ path: 'game.balance', label: 'Баланс', type: 'number', min: 0, step: 1 },
		{ path: 'game.betOptions', label: 'Ставки (-/+)', type: 'list', hint: 'через кому, по зростанню' },
		{ path: 'game.bet', label: 'Стартова ставка', type: 'number', min: 0, step: 0.5,
			hint: 'підганяється під найближче значення зі списку' }
	]],
	['Тапи', tapFields()],
	['Джекпоти', [
		{ path: 'game.jackpots.minor', label: 'Minor', type: 'number', min: 0, step: 0.01 },
		{ path: 'game.jackpots.grand', label: 'Grand', type: 'number', min: 0, step: 0.01 },
		{ path: 'game.jackpots.major', label: 'Major', type: 'number', min: 0, step: 0.01 }
	]],
	['Тексти гри', [
		{ path: 'texts.freeSpinsButton', label: 'Кнопка Free Spins', type: 'text', hint: 'HTML, <br> — перенос рядка' },
		{ path: 'texts.balanceLabel', label: 'Підпис балансу', type: 'text' },
		{ path: 'texts.betLabel', label: 'Підпис ставки', type: 'text' },
		{ path: 'texts.lastWinLabel', label: 'Підпис виграшу', type: 'text' },
		{ path: 'texts.jackpotMinor', label: 'Джекпот Minor', type: 'text' },
		{ path: 'texts.jackpotGrand', label: 'Джекпот Grand', type: 'text' },
		{ path: 'texts.jackpotMajor', label: 'Джекпот Major', type: 'text' }
	]]
]

// Deliberately file-only (config.json): game.jackpotGrowth / jackpotInterval
// (cosmetic ticking speed), assets.* (art keys/URLs), cta.target, dev.*,
// texts.rotateNotice.
