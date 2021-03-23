# TokenCasino
Ethereum SmartContract based dApp casino

The dApp consists of:
* a native token *CasinoToken*, issues by the *Bank* contract in exchange for USDC tokens. The conversion rate is defined at creation  and cannot be changed afterwards. This token is not divisible. The token stores the USDC amount transferred to it and mints CasinoToken according to the conversion rate.
* a pseudo-random number generator named *RandomNumberOracle* it is seeded by the admin and will product pseudo-random number required for the game in the *Casino*. To limit the cost it does not request a new random number from an external source for each request, but instead can be reseeded.
* a *Casino* offering the player to place a bet in a higer card wins game: both players draw a card and the higher wind. In case of a draw, the Casino wins (this is the Casino edge).

The Casino can be called via a Webapp created using React JS. It integrates with [MetaMask](https://metamask.io/) as Ethereum Wallet and uses [ethers.js](https://docs.ethers.io/v5/).
