# 8-Puzzle Heuristic Simulator

A single-file HTML/CSS/JavaScript app that solves the 8-puzzle with the **A\*** search algorithm and shows, in real time, how three heuristics score every move the AI could make.

**To run it:** open `8-puzzle-simulator.html` in any modern browser. No build step, no dependencies, no network access.

---

## Contents

1. [The 8-puzzle game](#1-the-8-puzzle-game)
2. [Heuristics and admissible heuristics](#2-heuristics-and-admissible-heuristics)
3. [The A\* algorithm](#3-the-a-algorithm)
4. [How the simulator works](#4-how-the-simulator-works)

---

## 1. The 8-puzzle game

### How it is played

The board is a $3 \times 3$ grid holding eight numbered tiles (1–8) and one empty square (the **blank**, written `0` in code and `_` below). The only legal move is to slide a tile that is horizontally or vertically adjacent to the blank into the blank. Equivalently, you can think of every move as *moving the blank* up, down, left or right.

The aim is to reach a given arrangement using as few moves as possible.

### Initial state and goal state

A **state** is one arrangement of the nine squares. This project stores it as a list of 9 numbers read row by row.

| | Initial state (default) | Goal state |
|---|---|---|
| List form | `[8,6,4,2,1,3,5,7,0]` | `[1,2,3,4,5,6,7,8,0]` |
| Board | `8 6 4` / `2 1 3` / `5 7 _` | `1 2 3` / `4 5 6` / `7 8 _` |

The default initial state is the one used in the accompanying Colab notebook. Its optimal solution is **26 moves**. The *Shuffle* button creates other random starting states.

### State space

The **state space** is the set of every state reachable from the initial state, with an edge between two states if one move turns one into the other. It is a graph, not a tree, because different move sequences can reach the same arrangement.

Each state has between 2 and 4 neighbours, depending on where the blank is:

| Blank position | Legal moves |
|---|---|
| Corner (4 squares) | 2 |
| Edge, not corner (4 squares) | 3 |
| Centre (1 square) | 4 |

### Number of possible states

- The tiles and blank can be arranged in $9! = 362{,}880$ ways.
- Exactly **half** of those, $9!/2 = 181{,}440$, can reach the goal. The other half sit in a separate, disconnected part of the space and can never be solved.
- **Solvability test:** write the tiles in row order, ignore the blank, and count *inversions* (pairs where a larger number comes before a smaller one). On a $3 \times 3$ board a state is solvable if and only if the inversion count is **even**. A horizontal move never changes the count and a vertical move changes it by an even amount, so the parity can never flip.
- The hardest solvable states need **31 moves**; the average optimal solution is about 22 moves.

The simulator's *Shuffle* button only produces solvable states, using this parity test.

### Search tree

Search algorithms unfold the state graph into a **search tree**. The root is the initial state, its children are the states one move away, and so on. A node also records its parent, so the solution path can be rebuilt by walking back up to the root.

First two levels from the default start state, with $g$ = moves so far, $h_2$ = Manhattan distance, $f = g + h_2$:

```
                 8 6 4
                 2 1 3        g=0  h2=16  f=16
                 5 7 _
               /         \
         8 6 4             8 6 4
         2 1 _             2 1 3
         5 7 3             5 _ 7
      g=1 h2=17 f=18     g=1 h2=17 f=18
```

The blank sat in a corner, so there were only two children. Because the same state can appear on many branches (a move followed by its reverse returns to the parent), the raw tree grows exponentially and is far larger than the 181,440-state space. Good search code therefore keeps a **closed set** of states already expanded and does not expand them twice. This simulator does that.

---

## 2. Heuristics and admissible heuristics

### What a heuristic is

A **heuristic** $h(n)$ is a cheap estimate of the cost of the cheapest path from state $n$ to the goal. Written $h^*(n)$ for the true cost, a heuristic is a guess at $h^*(n)$. A good heuristic lets the search focus on promising states instead of exploring blindly.

### The two heuristics used here

| Name | Symbol | Definition |
|---|---|---|
| **Misplaced tiles** | $h_1(n)$ | Number of tiles (blank excluded) that are not on their goal square. |
| **Manhattan distance** | $h_2(n)$ | For every tile, the number of rows plus the number of columns it is from its goal square, summed over all tiles (blank excluded). |

The third column of the simulator's table is **max(h₁, h₂)**, the larger of the two.

**Worked example** on the default start `8 6 4 / 2 1 3 / 5 7 _`:

- $h_1 = 8$, because all eight tiles are out of place.
- $h_2 = 16$, the sum of the eight individual tile distances.
- The true optimal cost is $h^* = 26$.

Both estimates are below 26, and $h_2$ is the closer one.

### Admissible heuristics

A heuristic is **admissible** if it never overestimates the true cost:

$$0 \le h(n) \le h^*(n) \quad \text{for every state } n,$$

and $h(\text{goal}) = 0$.

Why it matters: A\* is guaranteed to return an **optimal** solution when its heuristic is admissible. An overestimating heuristic can make the search skip over the best path.

**Both heuristics are admissible:**

- $h_1$: each misplaced tile has to be moved at least once, and one move moves one tile, so at least $h_1$ moves are needed.
- $h_2$: one move slides one tile by exactly one square, so it reduces that tile's distance by at most 1. At least $h_2$ moves are therefore needed.

Both heuristics are also **relaxations** of the puzzle: $h_1$ is the exact cost if a tile could jump anywhere in one move, and $h_2$ is the exact cost if tiles could slide onto occupied squares.

### Dominance and combining heuristics

- A heuristic $h_a$ **dominates** $h_b$ if $h_a(n) \ge h_b(n)$ for all $n$. If both are admissible, the dominating one is better: it is closer to the truth and A\* expands fewer nodes.
- Every misplaced tile is at least one square from home, so $h_2(n) \ge h_1(n)$ always. **$h_2$ dominates $h_1$.**
- The **maximum of admissible heuristics is admissible**: if each is at most $h^*$, so is their max. It also dominates every heuristic inside it, so it is at least as good as any of them.
- **Consistency** (also called monotonicity) is a stronger property: $h(n) \le c(n,n') + h(n')$ for every move $n \to n'$ with cost $c = 1$. Consistent heuristics never need a state to be re-opened, and $f$ never decreases along a path. $h_1$, $h_2$ and their max are all consistent.

> **Note for this project:** because $h_2 \ge h_1$ in the 8-puzzle, $\max(h_1, h_2)$ is always equal to $h_2$ and the third column always matches the second. The column is kept to demonstrate the technique. It only pays off when neither heuristic dominates the other, which does not happen with this particular pair.

Measured with this simulator's A\* on the default start state (every run finds the same 26-move optimal path):

| Heuristic driving A\* | Nodes expanded |
|---|---|
| max(h₁, h₂) | 1,746 |
| h₂ (Manhattan) | 1,746 |
| h₁ (Misplaced) | 26,896 |

Counts depend on how ties are broken, so other implementations (including the Colab notebook, which reports 4,820 expansions) will differ. The ordering, however, is always the same: the better the heuristic, the fewer nodes.

---

## 3. The A\* algorithm

### Idea

A\* is a best-first search. It always expands the open node with the lowest **evaluation function**

$$f(n) = g(n) + h(n)$$

- $g(n)$ — actual number of moves from the initial state to $n$ (cost so far).
- $h(n)$ — heuristic estimate of the moves from $n$ to the goal (cost to go).
- $f(n)$ — estimated cost of the cheapest solution that passes through $n$.

Setting $h = 0$ gives uniform-cost search (breadth-first here). Dropping $g$ gives greedy best-first search, which is fast but not optimal. A\* uses both.

### Data structures

- **Open list (fringe):** a priority queue ordered by $f$. This implementation uses a binary min-heap.
- **Closed set:** states already expanded.
- **Best-$g$ table:** the cheapest known $g$ for every discovered state.
- **Parent links:** so the path can be rebuilt once the goal is reached.

### Pseudocode

```
A*(start, goal, h):
    open   <- priority queue ordered by f
    push start with g = 0, f = h(start)
    closed <- empty set
    bestG[start] <- 0;  parent[start] <- none

    while open is not empty:
        n <- pop node with lowest f
        if n in closed: continue            # stale duplicate entry
        if n == goal:
            return path rebuilt from parent links
        add n to closed
        for each legal move n -> m:
            if m in closed: continue
            g' <- g(n) + 1
            if g' < bestG[m]:               # found a cheaper way to m
                bestG[m] <- g';  parent[m] <- n
                push m with g = g', f = g' + h(m)

    return failure                           # unsolvable
```

### Properties

- **Complete:** it finds a solution if one exists. On a solvable 8-puzzle that is guaranteed; on an unsolvable one it would have to exhaust all 181,440 reachable states, which is why unsolvable boards are excluded.
- **Optimal:** the returned path has the fewest possible moves when $h$ is admissible (tree search) or consistent (graph search with a closed set, as here).
- **Efficient:** with a heuristic that is closer to $h^*$, fewer nodes are expanded. Memory is the usual limit, since all generated nodes are stored. The 8-puzzle's small state space keeps this trivial.
- **Behaviour of $f$:** along the optimal path, $f$ never decreases when $h$ is consistent. In the notebook's run, $f$ climbs from 16 to 26 and then stays at 26 until the goal.

### How this differs from the notebook

The Colab notebook implements the same algorithm with plain Python lists: it finds the minimum $f$ by scanning the whole fringe and checks for repeated states by scanning the explored list, so each step costs time proportional to the size of those lists. This project uses a heap and hash lookups instead, which is why it solves the puzzle in a few milliseconds.

---

## 4. How the simulator works

### Screen layout

```
+------------------------------+----------------------+
|  Heuristic table (left)      |  Board (right)       |
|                              |                      |
|  State | h1 | h2 | max(h1,h2)|   [ 3 x 3 navy board]|
|  NOW   | .. | .. |  ..       |   Moves | Optimal |  |
|  A     | .. | .. |  ..       |         | Expanded   |
|  B     | .. | .. |  ..       |   [Run] [Reset] [Shuffle]
|  C     | .. | .. |  ..       |   heuristic / speed  |
|  D     | .. | .. |  ..       |   tile-distance toggle
+------------------------------+----------------------+
```

White page, navy board, white tile numbers. Tiles that are on their goal square get a lighter fill and a white outline.

### The heuristic table

- The **NOW** row scores the board as it currently stands.
- Rows **A, B, C, D** are the states reachable in one move, labelled in a fixed order: blank moves up, down, left, right (rows only appear for moves that exist, so a corner blank shows just A and B). Each row shows a small board preview with the moved tile highlighted, and the move as "tile N ↑/↓/←/→".
- The three value columns are $h_1$, $h_2$ and $\max(h_1, h_2)$.
- **▼ / ▲** under a value shows how it differs from the NOW row (green ▼ = the move improves the estimate, red ▲ = it worsens it).
- While the AI is running, the row for the move it is **about to make** is highlighted. After the move is played the whole table is recomputed for the new board, so the values update live as the AI moves.
- The highlighted row is the next step on the *optimal path*. It is **not** necessarily the row with the lowest $h$: A\* ranks by $f = g + h$, and sometimes the best route goes through a state whose estimate temporarily rises (the default puzzle starts with exactly that: $h_2$ goes 16 → 17).

### Controls

| Control | What it does |
|---|---|
| **Run / Pause** | Run searches from the current board with A\* (a brief "Searching…" message appears), then plays the solution one move at a time. The same button becomes **Pause**; pausing freezes the board and table exactly where they are, and Run resumes from that point. |
| **Reset** | Stops any run and restores the starting board, clearing the move counter and search statistics. |
| **Shuffle** | Picks a new random *solvable* starting board and resets to it. Reset afterwards returns to that new board. |
| **AI heuristic** | Chooses which heuristic A\* uses: max(h₁, h₂), h₂, or h₁. Locked while running. Switch to h₁ to see many more nodes expanded. |
| **Speed** | Delay between moves, roughly 0.2 s to 1.8 s per move. Applies live. |
| **Show tile distances** | Overlays each tile with its own Manhattan distance, so you can see how $h_2$ is built up. |
| **Click a tile** | When not running, a tile next to the blank slides into it. After a manual move the old plan is discarded and Run solves again from the new board. |

Stats under the board show **Moves** played so far, **Optimal** (length of the solution A\* found) and **Expanded** (nodes A\* expanded during the search).

### Inside the file

The script has two parts, with the algorithm kept separate from the interface:

| Part | Contents |
|---|---|
| **Logic** (between the `LOGIC START` / `LOGIC END` comments) | `GOAL` and `START`; `H.h1`, `H.h2`, `H.max`; `successors()` (legal moves); `solvable()` (inversion parity test); `MinHeap`; `aStar()`; `randomSolvable()`. It touches nothing in the page, so it can be copied into other projects or tested under Node. |
| **UI** | Builds the eight tile elements once and moves them with CSS transforms (which gives the sliding animation); `renderTable()` recomputes the table; `onRun`, `step`, `pause`, `finish`, `onReset`, `onShuffle` and `onTileClick` handle the controls. |

**Run loop:** after `aStar()` returns the full path, `step()` repeats: draw the table for the current board with the next state highlighted → wait for the speed delay → move the board to that state → repeat until the goal is reached. Pause just cancels the pending timer.

### Customising

- **Different start state:** edit the `START` array in the logic section. It must be a permutation of 0–8 with an even inversion count.
- **Different goal:** edit `GOAL`. The heuristics read the goal square of tile $v$ as index $v-1$, so a different goal needs `H.h2` updated to look positions up from `GOAL` instead.
- **New heuristic:** add a function to `H` and an option to the select box; `aStar` accepts any function that takes a state and returns a number.

### Limitations

- The search runs on the main thread. Solutions are found in milliseconds for 8-puzzle states, but a much larger puzzle would need a Web Worker.
- The solver only plays the optimal path found by A\*. It does not animate the search frontier (which nodes were expanded or discarded), only the resulting moves.

---

## References

- Russell, S. and Norvig, P., *Artificial Intelligence: A Modern Approach*, the chapters on informed search and heuristic functions (8-puzzle, admissibility, consistency, dominance).
- The accompanying Colab notebook, *8-Puzzle Problem using Searching Algorithms*, for the Python version of the same A\* search.
