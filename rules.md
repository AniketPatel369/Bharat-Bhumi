# Rules Roadmap

## Implemented
1. **Host-defined starting money**: Host selects starting balance (₹5,000 to ₹50,000) when creating the room; all players begin with that amount.
2. **Random first turn + turn enforcement**: Starting player is random, and only the active player can perform turn actions.
3. **Turn timers**: 1-minute roll window and 2-minute action window, with auto-roll/auto-end fallback.
4. **Start reward**: Passing or landing on START gives ₹2,000.
5. **Board landing rules (corner/tax/cards)**:
   - Income/Super Tax squares deduct the tax amount.
   - GO TO JAIL sends player to Jail.
   - FREE PARKING (Rest Room rule) charges a fixed ₹300 fee to bank.
   - Chance and Community cards are resolved server-side.
6. **Jail flow**:
   - On Jail entry, player loses next turn.
   - Player may pay ₹500 bail to take turn immediately.
7. **Doubles rule**:
   - First double grants one extra turn.
   - On second consecutive double, player chooses continue or end turn.
   - If player continues and rolls third consecutive double, they go to Jail.
8. **Houses + hotels**:
   - Build up to 4 houses on monopoly properties (even build rule).
   - Hotel can be built only after houses are completed.
9. **Ownership + rent**: Owned properties charge rent; monopoly/house/hotel multipliers are applied.
10. **Bankruptcy recovery**: Players can sell property to bank or start timed auctions.
11. **Mortgage / unmortgage**:
   - Mortgage gives immediate cash (typically ~50% value).
   - Mortgaged properties do not collect rent.
   - Unmortgage requires mortgage value + 10% interest.
12. **Trading between two players**:
   - One-to-one trade action supports property exchange and cash exchange.
   - Trade update is validated before applying both player updates to preserve consistency.
13. **Win condition + leaderboard**: Players can be eliminated; final standings are broadcast when end condition is met.

## Mortgage (What it means)
Mortgage is a way to get emergency cash from a property **without selling it**.

- You keep ownership of the property.
- Bank gives you mortgage amount (usually half of property value).
- While mortgaged, that property does **not** collect rent.
- To reactivate, you unmortgage by paying mortgage amount + interest.

Use mortgage when you need short-term cash and want to keep long-term ownership.

## Next (Planned)
- Add UI-first trade negotiation flow (offer/accept/reject) in the client.
- Add visible mortgage badges and quick mortgage actions in property modal.
- Add card history log in game feed.
