# Content, voice and equity

Part of the [Piper design standards](README.md).

## Voice

- Say "reports", never "rats" as a count. "Expected reports", never "predicted rats".
- "Residents", never "complainants". Conditions are the subject: "Trash out early
  on this block", not "This block's residents leave trash out".
- Never "infested", "plague", "outbreak" about a place. Folklore words (Piper,
  the doctor, specimen) are for the brand only.
- Numbers first, short sentences: "Monitored 11 times. Came back 9."
- Correlation is "goes with", never "causes".
- Buttons are verbs: Approve, Edit, Reject, Reveal, Print, Ask.
- Time: relative under 24 h ("4 min ago"), else `Oct 24` / `Oct 24, 2025`.

## Equity rules (binding)

After controlling for 311 volume, tracts with more children, people of color and
residents with disabilities file fewer rodent reports per resident
(`.kiro/specs/rat-audit/data-audit.md` §4). A raw-count map sends inspectors to
the loudest blocks. So:

1. **Quiet isn't clean.** Under-reporting tracts carry the Listening-gap texture
   and the label "Fewer reports per resident here; may be under-counted." Empty
   states add "That can also mean nobody reported."
2. **Fair ranking.** Top-10 lists offer *Citywide* and *Within each
   neighborhood*; the coordinator view defaults to within-neighborhood.
3. **Rates, not counts,** for any area comparison (reports per 100 total 311).
4. **Conditions are the subject.** "Trash out early on this block", never "this
   block's residents".
5. **Folklore is for the brand, never for places.** In 1900 San Francisco
   quarantined Chinatown during a plague scare. Piper never calls a place
   infested and never uses plague words about a neighborhood.
6. **Two voices.** Show the resident's words (scrubbed) beside the city's closure
   note when both exist.
7. **Privacy.** Owner names and full addresses stay blurred until a logged reveal.
8. **The Do-No-Harm test** in every review: *If I lived on this block, would I
   feel blamed?* (Urban Institute, Do No Harm Guide).

## Glossary (one term per concept)

| Say | Don't say |
|---|---|
| report | rat, sighting (as a count) |
| report after an earlier closure | rats came back, treatment failed |
| repeat-report place | problem property |
| expected reports | predicted rats |
| residents | complainants, callers |
| closure note | resolution |
| draft work order | ticket, citation (it is never sent) |

“Review suggested” is the queue heuristic, not a deadline. Use “nearby records” for spatial context and “no association detected” for a null result; neither establishes a cause or absence of an effect.
