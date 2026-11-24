# b.accountant: learnings
- Context size sets the price of a wake. 21 Nov: conductor.mistral at about 726k context cost about 19 USD an hour; a fresh session doing the same hourly round at 240k to 290k cost about 1.41 USD a round.
- Hand a looping session to a fresh one before about 300k context.
- cost_usd shows only between turns; a run's cost is the reading after minus the reading before. Some archived sessions show no cost at all.
- Mistral API calls overnight on 20 and 21 Nov cost about 0.41 USD; the Claude sessions around them cost about 194 USD. The model calls are rarely the cost; the sessions are.
- An empty round still costs something if it wakes a model. Check with a script first, and wake an agent only when there is work.
- Archiving saves nothing directly (idle sessions spend nothing); the saving is the small context after a hand-over.
