# Tic-Tac-Toe Minimax / Alpha–Beta Inspector — How It Works

`tictactoe_inspector.html` is a single-file tool (HTML + CSS + vanilla JS) that plays Tic-Tac-Toe against a computer **and shows the search the computer performs**. It is built for inspecting the algorithms rather than for casual play. The algorithms are ported from `tictactoe.ipynb` (`check_winner`, `minimax`, `alpha_beta`).

---

## 1. Introducing Minimax and Alpha–Beta Pruning

### 1.1 Why Tic-Tac-Toe is an "adversarial search" problem

Tic-Tac-Toe is two-player, turn-based, zero-sum and perfect-information. Whatever one side gains, the other loses, and both sides see the whole board. That makes it ideal for **Minimax**.

### 1.2 Minimax

Minimax assumes both players play perfectly. It looks at every possible future of the game and passes a score back up the tree:

- One player is **MAX**: it picks the child with the **highest** score.
- The other is **MIN**: it picks the child with the **lowest** score.
- At a finished game (win, loss, draw) the score is read off directly. Every other node takes the best score among its children, from the point of view of whoever is to move there.

In this tool:

| Mark | Player | Role |
|------|--------|------|
| **O** (red) | Human | MAX |
| **X** (blue) | Computer | MIN |

Pseudocode (matches the `mm()` function in the file):

```
minimax(board, ply):
    if someone has won or board is full:
        return terminal_score(board, ply)
    if O to move:                      # MAX
        best = -infinity
        for each empty cell:
            place O; best = max(best, minimax(board, ply+1)); undo
        return best
    else:                              # X to move, MIN
        best = +infinity
        for each empty cell:
            place X; best = min(best, minimax(board, ply+1)); undo
        return best
```

The cost is the weak point: from the empty board there are roughly **550,000** positions to examine.

### 1.3 Alpha–Beta Pruning

Alpha–Beta returns **the same move** as Minimax but skips branches that cannot change the final decision. It carries a window **[α, β]** down the tree:

- **α** = the best score MAX is already guaranteed somewhere higher up (starts at −∞).
- **β** = the best score MIN is already guaranteed somewhere higher up (starts at +∞).

If at any node **β ≤ α**, the two players' guarantees have crossed: a rational opponent would never let the game reach this node, so **the remaining siblings are pruned** (never searched).

Pseudocode (matches `ab()`):

```
alphabeta(board, ply, alpha, beta):
    if terminal: return terminal_score(board, ply)
    if O to move:                      # MAX
        best = -infinity
        for each empty cell:
            best  = max(best, alphabeta(child, ply+1, alpha, beta))
            alpha = max(alpha, best)
            if beta <= alpha: break    # cut-off
        return best
    else:                              # MIN
        best = +infinity
        for each empty cell:
            best = min(best, alphabeta(child, ply+1, alpha, beta))
            beta = min(beta, best)
            if beta <= alpha: break    # cut-off
        return best
```

**Why it matters:** the work shrinks dramatically. In a test run, after a centre opening the computer's search from that position examined **55,505** positions with plain Minimax versus **2,459** with Alpha–Beta (about 96% fewer). The tool shows this comparison live in the "Last computer search" box.

---

## 2. Features of This System

### 2.1 Fixed roles and the Start screen

- The roles are fixed and always shown on screen: **O = Human = MAX** and **X = Computer = MIN**. This never changes.
- The start screen shows an empty board and a **Who opens?** choice:
  - **O Human (MAX) moves first.**
  - **X Computer (MIN) moves first.**
- The choice only decides **who opens**, not who plays which mark or which role they have. There is no "X must go first" rule.
- Press **Start** to begin.

### 2.2 Gameplay

- Standard 3×3 rules, with a **turn indicator** above the board.
- **O is red, X is blue** everywhere: board, tree, labels, highlights.
- When someone gets three in a row, a **line is drawn across the winning cells** and those cells pulse in the winner's colour. Draws are announced explicitly.
- **Restart** returns to the start screen.

### 2.3 AI engine and controls (left column)

| Control | What it does |
|---------|--------------|
| **Alpha–Beta pruning** checkbox | Switches the computer's search between plain Minimax and Alpha–Beta. Can be toggled mid-game; during the computer's turn the forward tree is rebuilt immediately. |
| **AI moves** selector | *When I press "Play AI move"* (default) lets you inspect the tree before the computer commits. *Automatically after 1.5 s* plays it for you. |
| **Auto-expand depth in tree** | How many levels of the forward tree open by default (1, 2 or 3). |
| **Reset tree expansion** | Collapses/re-expands the forward tree back to the default depth. |
| **Last computer search** box | Positions examined by Minimax vs. Alpha–Beta for the current search, and the percentage saved. |

The computer picks the child with the lowest score for X (MIN). On ties it takes the **lowest-numbered cell**, which is why it opens on cell 0 when it goes first (every opening is a draw under perfect play).

### 2.4 The game-tree state viewer (right column)

The tree grows **one real move at a time**. At any moment the panel shows exactly two things:

1. **The spine** – the single chain of moves actually played, from the empty board to the current position.
2. **One forward search subtree** – rooted at the current node, shown only on the computer's turn.

Turn by turn:

1. **Game start:** one node, the empty board.
2. **Human moves:** that node is kept, every sibling is discarded.
3. **Computer's turn:** the tree expands forward from the current node to show the candidate moves X is considering, each with its score. The search is full-depth and **rebuilt from scratch every turn**.
4. **Computer moves:** only the chosen node is kept; the whole forward subtree is discarded.
5. Repeat.

Because the full tree is huge, nodes are **expanded lazily**: the first levels open automatically, and any node can be opened or closed with its **▸ / ▾** button. The number next to ▸ is how many empty cells (moves) the node has.

**What each node card shows**

- A mini board (the most recently placed mark has a pale-yellow cell).
- Who is to move, plus the role chip **MAX** (O, red) or **MIN** (X, blue). Finished positions say "O wins", "X wins" or "Draw".
- The **score** and the **ply**.
- With Alpha–Beta on: the **[α, β] window** the node was searched with, and `✂ N pruned` if some of its children were cut.

**Pruned branches** appear as hatched, dashed `✂ PRUNED` stubs ("β ≤ α — never searched") in the position where they would have been searched.

**Highlights**

| Marker | Meaning |
|--------|---------|
| `ROOT` pill, thick black border | The empty board. |
| `CURRENT` pill, amber border and fill | The position currently on the board (the search root on the computer's turn). |
| `AI CHOICE` pill, blue left bar | The node of the computer's most recent move. |
| `HUMAN MOVE` pill, red left bar | The node of the human's most recent move. |

After the computer moves, `AI CHOICE` and `HUMAN MOVE` appear side by side so you can see where the AI's reply landed. The spine edges (`↓ X → cell 4 (computer move)`) keep the path from the root to the current state traceable. Cells are numbered 0–8, left to right, top to bottom.

### 2.5 Layout

Two columns (board and controls on the left, tree on the right) on a plain white background. On narrow screens the columns stack vertically.

---

## 3. Reading the Numbers (+1, +3, −3, 0, …)

### 3.1 The scoring rule

Scores come directly from the notebook's formulas:

| Outcome | Score |
|---------|-------|
| **O wins** | **10 − ply** |
| **X wins** | **ply − 10** |
| **Draw** | **0** |

**ply** = the number of marks on the board when the game ends, i.e. how many moves have been played since the empty board. (The `ply` is printed on every card.) The shown score of a non-final node is the Minimax value: the result you get if both sides play perfectly from there.

### 3.2 What the sign means

- **Positive** → O (the human, MAX) wins with perfect play.
- **Negative** → X (the computer, MIN) wins with perfect play.
- **0** → a draw with perfect play.

### 3.3 What the size means

The size tells you **how fast** the win comes: `10 − |score|` is the ply at which the game ends. A bigger magnitude means a quicker win. This makes MAX prefer faster wins and slower losses, and MIN does the same from its side.

| Score | Reading |
|-------|---------|
| **+5** | O wins at ply 5 (O's 3rd mark – the fastest possible O win when O opens). |
| **+3** | O wins at ply 7. |
| **+1** | O wins at ply 9 (the last square of the board). |
| **+4 / +2** | O wins at ply 6 / 8 (possible when X opens, so O moves on even plies). |
| **−5** | X wins at ply 5 (fastest X win when X opens). |
| **−3** | X wins at ply 7. |
| **−1** | X wins at ply 9. |
| **−4 / −2** | X wins at ply 6 / 8 (possible when O opens). |
| **0** | Draw. |

So **+3** means "O can force a win that completes on the 7th move", and **−3** means "X can force a win that completes on the 7th move". **+1** and **−1** are wins that only arrive on the very last square.

Parity shortcut: whoever opens plays on odd plies (1, 3, 5, 7, 9), so
- if **O opens**: O's wins are +5, +3, +1 and X's are −4, −2;
- if **X opens**: X's wins are −5, −3, −1 and O's are +4, +2.

### 3.3.1 What a score of 0 means

Wins and losses always score at least 1 in magnitude (`10 − ply` is never 0 for a legal game), so **0 can only come from a draw**. It appears in two kinds of node:

1. **A finished draw.** The board is full and nobody has three in a row. The card says "Draw" and the score is 0.
2. **An unfinished position that is a draw with perfect play.** Neither side can force a win from here: whatever one side tries, the other has a reply that holds the draw. The card still says who is to move, but the score is 0.

Some consequences to keep in mind when reading the tree:

- **The empty board scores 0.** Tic-Tac-Toe is a draw under perfect play, so the ROOT card shows 0 whether O or X opens. For the same reason, all nine opening moves the computer considers when it goes first score 0 (no opening throws the game away against perfect play). The tie is broken in favour of the lowest cell number, which is why the computer opens on cell 0.
- **0 is a verdict about perfect play, not a promise.** A 0 position can still be lost by a mistake. If the player to move picks a child with a worse score, the next card will show a different number (for example a 0 node whose child is −3 means "this move lets X force a win").
- **Along the spine, 0 means "no one has slipped yet".** If consecutive spine cards keep showing 0, both sides have played the best moves so far. The first card where the score jumps to a positive or negative value marks the move that handed the other side a forced win.
- **In the forward tree, siblings can differ.** A MIN node (X to move) with children `0, 0, −3` has value −3, because MIN picks the lowest. A MAX node (O to move) with children `0, −3, −5` has value 0, because MAX picks the highest and a draw beats a loss.
- **0 is not a bound-free guarantee under Alpha–Beta.** On a branch that cannot beat the current best, Alpha–Beta may stop early, so a displayed 0 can mean "at least/at most 0" rather than an exact value. Turn Alpha–Beta off to see exact values everywhere. The best move's score is always exact.

### 3.4 Worked example

Take the notebook's demo board `X O X / O O _ / X _ _` in a game where **O opened**. Six marks are down, so it is **ply 6** and O is to move (O moves on even plies when it opens).

- O plays cell 5 (middle row `O O O`) or cell 7 (middle column `O O O`). Either way the game ends at **ply 7**, so that child is `10 − 7 =` **+3**.
- Cell 8 does not win immediately, so it is worth less (or is pruned).
- O (MAX) takes the best child, so the position at ply 6 itself shows **+3**.

The mirror case: whenever X completes three in a row at ply 7 the score is `7 − 10 =` **−3**, the same speed as the +3 above but in X's favour.

In general: read the sign for **who wins**, then compute `10 − |score|` for **when**.

### 3.5 Scores are comparable across the whole game

Depth is counted **from the empty board** (the notebook restarts depth at 0 for each search). Because of that, a position keeps the same score no matter when it is evaluated, and the numbers on the spine and in the forward tree line up. A node kept on the spine shows the exact score it had as a candidate.

### 3.6 The [α, β] window

With Alpha–Beta on, a node also shows `[α, β]`, the bounds it was searched with:

- `−∞` / `+∞` = no constraint yet (the search root always starts `[−∞, +∞]`).
- A narrowed window such as `[+3, +∞]` means "MAX already has a line guaranteeing at least +3 elsewhere"; anything MIN can hold below +3 here is irrelevant and can be cut.
- When β ≤ α at a node, its remaining children become `✂ PRUNED` stubs.

### 3.6.1 Scores can be bounds under Alpha–Beta

Alpha–Beta only guarantees the **best move and its score** are exact. A branch that cannot beat the current best may be cut short, so its displayed score can be a **bound** (at most / at least) instead of its true Minimax value. This is why the panel carries a small note. Switching Alpha–Beta off shows exact values everywhere.

### 3.7 Quick cheat sheet

1. **Sign** → who wins with perfect play (+ = O/human, − = X/computer, 0 = draw, whether the board is already full or the draw is only forced with best play).
2. **Magnitude** → speed: ply of the finish = `10 − |score|`.
3. **ply on the card** → how many moves have been played to reach that position.
4. **[α, β]** → the search window; once β ≤ α, the siblings after it are pruned.
