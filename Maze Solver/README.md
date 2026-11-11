# Maze Solver

A single-file, dependency-free web app that demonstrates how classic search algorithms solve a grid maze. Open `maze_solver.html` in any modern browser; there is nothing to install or build.

The maze is a grid of cells where some cells are obstacles. The agent starts at the **start** cell (red) and tries to reach the **destination** (green) by moving one cell at a time. Every move costs 1, so the shortest path is the one with the fewest steps.

---

## Search algorithms

| Algorithm | Frontier | Picks next cell by | Complete? | Optimal? | Time | Space |
|---|---|---|---|---|---|---|
| **BFS** (Breadth-First Search) | FIFO queue | Oldest discovered | Yes | Yes (unit step cost) | O(V + E) | O(V) |
| **DFS** (Depth-First Search) | LIFO stack | Newest discovered | Yes (finite grid + visited set) | No | O(V + E) | O(V) |
| **Greedy Best-First** | Priority queue | Lowest `h(n)` | Yes (finite grid + visited set) | No | O(E log V) | O(V) |
| **A\*** | Priority queue | Lowest `f(n) = g(n) + h(n)` | Yes | Yes (admissible heuristic) | O(E log V) | O(V) |

Here V is the number of free cells and E is the number of moves between them.

### Breadth-First Search (BFS)
Explores the maze in rings of increasing distance from the start. Because every step costs the same, the first time it reaches the destination is guaranteed to be via a shortest path. It is uninformed: it ignores where the destination is, so it often expands many cells.

### Depth-First Search (DFS)
Follows one branch as deep as it can, then backtracks when it hits a dead end. It uses little memory and can get lucky, but the path it returns is usually longer than necessary because it takes the first route it finds, not the best one.

### Greedy Best-First Search
An informed search that always expands the cell that *looks* closest to the destination according to the heuristic `h(n)`. It usually expands far fewer cells than BFS, but it only looks at the remaining distance and ignores the cost already paid, so it can be led into detours and does not guarantee the shortest path.

### A\* Search
Expands the cell with the smallest `f(n) = g(n) + h(n)`, where `g(n)` is the steps taken so far and `h(n)` is the estimated steps remaining. Both heuristics offered here never overestimate the true distance (they are admissible and consistent on a 4-direction unit-cost grid), so A* returns a shortest path while typically expanding fewer cells than BFS.

### Heuristics (Greedy and A\* only)

| Heuristic | Formula | Notes |
|---|---|---|
| **Manhattan** | `abs(dx) + abs(dy)` | Exact lower bound for 4-direction movement; the tighter of the two |
| **Euclidean** | `sqrt(dx² + dy²)` | Straight-line distance; admissible but weaker, so A* may expand more cells |

The heuristic dropdown is disabled for BFS and DFS because they do not use one.

### Transition function
Moves are tried in a fixed order, which also makes the results deterministic and the tie-breaking easy to reason about:

| # | Action | Δ(x, y) |
|---|---|---|
| 1 | Up | (0, −1) |
| 2 | Left | (−1, 0) |
| 3 | Down | (0, +1) |
| 4 | Right | (+1, 0) |

A move is valid only if the target cell is inside the grid and is not an obstacle. Coordinates are `(x, y)` = (column, row), with `(0, 0)` at the top-left.

---

## Features

**Maze**
- Two grid sizes: **9 × 9** and **18 × 18**.
- **Randomize** places the chosen number of obstacles at random, never on the start or destination.
- Optional **Keep randomized mazes solvable** setting retries random layouts until a route exists.
- **Clear obstacles** empties the grid.
- Plain grid obstacles, not a generated maze, so you can build any layout you want.

**Editing by clicking**
- A **Click action** selector chooses what a click does: add/remove an **Obstacle**, move the **Start**, move the **Target**, or **Inspect** a cell.
- In Obstacle mode, click an empty cell to add an obstacle and click an existing obstacle to remove it.
- The number of obstacles you can add is capped by the **Obstacles** slider; the panel shows how many are placed against the limit.
- Start and destination can sit on any free cell (placing one on an obstacle clears that obstacle), and they can never be the same cell.

**Unsolvable mazes**
- A live badge above the maze shows **Solvable** or **Unsolvable** as you edit.
- A warning appears as soon as an edit cuts off the destination.
- You can still run an unsolvable maze: the search expands every reachable cell, then reports that no path exists.

**Running the search**
- The **Run** button below the maze animates the search step by step.
- Colors:

  | Element | Color |
  |---|---|
  | Obstacle | Black |
  | Start | Red |
  | Destination | Green |
  | Cells the agent has searched | Light blue |
  | Final path | Yellow |

- A **Speed** slider controls the animation, and **Reset search** stops a run and clears the colors.
- Editing, algorithm changes and size changes are locked while a search is running.
- After a run, four stats are shown: cells expanded, path length (steps), max frontier size, and compute time.

**Learning aids**
- **Show grid positions** toggles an `(x, y)` label on every cell. When hidden, the start and destination show **S** and **G**.
- **Transition function inspector:** choose **Inspect** (or right-click any cell in any mode) to see, for that cell, where each of Up / Left / Down / Right leads, or why it is blocked (obstacle or outside the grid). The neighboring cells are outlined and marked with arrows on the maze. For Greedy and A*, the panel also shows the cell's `h(s)`.
- A short description of the selected algorithm's behavior is shown in the Algorithm panel.

---

## Quick start

1. Open `maze_solver.html` in a browser.
2. Pick a size, set the number of obstacles, and press **Randomize** (or click cells to draw your own).
3. Use **Start** and **Target** in the Click action selector to move the endpoints.
4. Choose an algorithm (and a heuristic for Greedy or A*).
5. Press **Run**, then try another algorithm on the same maze and compare the stats.

Things worth trying:
- Run BFS and A* on the same maze: both find a shortest path, but A* usually expands fewer cells.
- Run DFS on the same maze: the path is often much longer.
- Compare Manhattan and Euclidean on A*: the path length is the same, but the cells expanded can differ.
- Wall in the start or destination to see the unsolvable notification.

---

## Technical notes

- One file: HTML, CSS and JavaScript, with no external libraries, fonts or network requests.
- The search runs to completion first, then the result is replayed as an animation, so the animation speed never affects the reported compute time.
- DFS, Greedy and A* only mark a cell as finished when it is taken off the frontier. A* breaks ties on `f` by preferring the lower `h`, then the cell added earlier.
- Search code is in the `search()` function, and the transition logic is in `transitions()`.
