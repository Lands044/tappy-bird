import { setGameNormalizer, mergeConfig, toNumber, clampInt } from '@js/config/config.js'
import { DEFAULT_CONFIG } from './game.defaults.js'

const EFFECTS = ['spin', 'drunk', 'zap']

const positive = (value, fallback) => {
	const n = toNumber(value, fallback)
	return n >= 0 ? n : fallback
}

// One scripted tap. A malformed field falls back to the matching default entry
// (by index), so a partial edit — e.g. only a multiplier — keeps the effect.
function normalizeTap(tap, fallback) {
	if (typeof tap !== 'object' || tap === null) return { ...fallback }
	return {
		effect: EFFECTS.includes(tap.effect) ? tap.effect : fallback.effect,
		winMultiplier: positive(tap.winMultiplier, fallback.winMultiplier)
	}
}

function normalizeGameConfig(input) {
	// The core normalizeConfig() merged the file over the CORE defaults only, so
	// the game's own sections (game, extra texts/assets keys) are filled in from
	// game.defaults.js here. Keys the core already has (texts.actionButton,
	// texts.ctaButton, assets.background) keep the core fallback when the file
	// omits them — public/config.json sets them explicitly.
	const config = mergeConfig(DEFAULT_CONFIG, input)
	const game = config.game
	const defaults = DEFAULT_CONFIG.game

	game.currency = typeof game.currency === 'string' ? game.currency : defaults.currency
	game.balance = positive(game.balance, defaults.balance)

	// The devmenu `list` field hands back strings — coerce, drop junk, keep order.
	const betOptions = (Array.isArray(game.betOptions) ? game.betOptions : [])
		.map(Number)
		.filter(n => Number.isFinite(n) && n > 0)
	game.betOptions = betOptions.length ? betOptions : [...defaults.betOptions]
	game.bet = positive(game.bet, defaults.bet)

	const taps = Array.isArray(game.taps) ? game.taps : []
	game.taps = taps.length
		? taps.map((tap, i) => normalizeTap(tap, defaults.taps[Math.min(i, defaults.taps.length - 1)]))
		: structuredClone(defaults.taps)

	const jackpots = {}
	const jackpotGrowth = {}
	for (const key of ['minor', 'grand', 'major']) {
		jackpots[key] = positive(game.jackpots?.[key], defaults.jackpots[key])
		jackpotGrowth[key] = positive(game.jackpotGrowth?.[key], defaults.jackpotGrowth[key])
	}
	game.jackpots = jackpots
	game.jackpotGrowth = jackpotGrowth
	game.jackpotInterval = clampInt(game.jackpotInterval, defaults.jackpotInterval, 100, 60000)

	return config
}

export function registerGameConfig() {
	setGameNormalizer(normalizeGameConfig)
}
