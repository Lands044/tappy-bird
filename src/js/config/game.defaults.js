import { DEFAULT_CONFIG as CORE_DEFAULTS } from '@js/config/defaults.js'

// Game-specific defaults for Tappy Bird, merged on top of the core shape
// (texts/cta/sound/dev).
//
// Mechanic: every tap on the bird (or SPIN) is one "tap" — it costs the current
// bet, plays a scripted effect and pays bet × winMultiplier. After the last
// scripted tap the CTA popup opens. Sounds are synthesized with WebAudio, so
// there is no `assets.sounds` block — only `sound.enabled`/`sound.volume` apply.
//
// Named game.defaults.js (not defaults.js) deliberately: the core kit already
// installs its own src/js/config/defaults.js at that exact path.

// No logo in this game — drop the core `assets.logo` key rather than leave it
// as a dead field.
const { logo: _logo, ...coreAssets } = CORE_DEFAULTS.assets

export const DEFAULT_CONFIG = {
	...CORE_DEFAULTS,

	game: {
		currency: "€",
		balance: 1500,
		// Bet ladder for the -/+ buttons, and the bet selected on load (snapped to
		// the nearest ladder value if it is not in the list).
		betOptions: [0.5, 1, 2, 3, 6, 10, 20, 50],
		bet: 6,

		// Scripted taps, in order. `effect` picks the bird animation + sound:
		//   spin  — plain spin
		//   drunk — wobble with orbiting stars
		//   zap   — lightning strike
		// `winMultiplier` × bet is paid out after the tap (0 = no win label).
		// The last entry ends the round and opens the CTA popup.
		taps: [
			{ effect: "spin", winMultiplier: 0 },
			{ effect: "drunk", winMultiplier: 0.2 },
			{ effect: "zap", winMultiplier: 0.8 }
		],

		// Starting values of the ticking jackpot bars, and how much each one grows
		// (random 0..growth) on every jackpotInterval tick.
		jackpots: {
			minor: 17.79,
			grand: 146.62,
			major: 30.56
		},
		jackpotGrowth: {
			minor: 0.03,
			grand: 0.12,
			major: 0.05
		},
		jackpotInterval: 1500
	},

	texts: {
		...CORE_DEFAULTS.texts,
		actionButton: "SPIN",
		ctaButton: "Download Now",
		freeSpinsButton: "BUY<br>FREE SPINS",
		balanceLabel: "BALANCE",
		betLabel: "BET",
		lastWinLabel: "LAST WIN",
		jackpotMinor: "MINOR",
		jackpotGrand: "GRAND",
		jackpotMajor: "MAJOR"
	},

	assets: {
		...coreAssets,
		background: "bg",
		backgroundMove: "bg-move",
		bird: "birdie"
	}
}
