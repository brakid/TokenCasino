# TokenCasino
Ethereum SmartContract based dApp casino

The dApp consists of:
* a native token *CasinoToken*, issues by the *Bank* contract in exchange for USDC tokens. The conversion rate is defined at creation of the bank and cannot be changed afterwards. This token is not divisible.
* a *Bank* contract that handles the buy in and cash out part.
* a pseudo-random number generator named *RandomNumberOracle* it is seeded by the admin and will product pseudo-random number required for the game in the *Casino*. To limit the cost it does not request a new random number from an external source for each request, but instead can be reseeded.
* a *Casino* offering the player to place a bet in a higer card wins game: both players draw a card and the higher wind. In case of a draw, the Casino wins (this is the Casino edge).
