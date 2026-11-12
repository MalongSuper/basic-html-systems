# Sorting Algorithms Visualizer

A single-file, dependency-free HTML page that animates 16 sorting algorithms step by step. Open `sorting_visualizer.html` in any modern browser (no server, no build, no network access needed). All CSS and JavaScript are inline.

It is built for teaching: every comparison, swap, shift and write is shown, with a one-line caption explaining what the algorithm is doing at that moment.

## What it does

1. You enter an array of values (default `[23, 47, 20, 63, 15]`).
2. You pick a sorting algorithm.
3. You press **Run** and watch the array being sorted, or step through it one move at a time.

The array sits in the center of the page. Values currently being considered by the algorithm are highlighted **light orange**; when the sort finishes, the whole array turns **light blue**. Everything else is navy on a plain white background.

## Algorithms (alphabetical)

| Algorithm | Extra view | Time | Space |
|---|---|---|---|
| Bead Sort | Abacus of beads falling down rods | O(S), S = sum of values | O(n × max) |
| Bogo Sort | Log of each permutation tried | Somewhat O(n!) or O(n!²) | O(n · n!) |
| Bubble Sort | | O(n²) | O(1) |
| Cocktail Sort | | O(n²) | O(1) |
| Comb Sort | | O(n²) worst case | O(1) |
| Counting Sort | Count array above the position (output) array | O(n + k) | O(k) |
| Heap Sort | Max-heap drawn as a binary tree, left of the array | O(n log n) | O(1) |
| Insertion Sort | | O(n²) | O(1) |
| Merge Sort | | O(n log n) | O(n) |
| Odd Even Sort | | O(n²) | O(1) |
| Pigeonhole Sort | One row per pigeonhole (index box + slot) | O(n + range) | O(range) |
| Quick Sort | Pivot is outlined | O(n²) worst, O(n log n) average | O(log n) stack |
| Radix Sort | Ten buckets (0 to 9) beneath the array | O(n · d) | O(n · d) |
| Selection Sort | Current minimum is outlined | O(n²) | O(1) |
| Shell Sort | | O(n²) | O(1) |
| Sleep Sort | Digital timer plus output row | Somewhat O(max + n) | O(n) |

The complexity of the selected algorithm is shown under the controls.

## Special views

- **Bead Sort**: each value becomes a row of beads on an abacus. Gravity pulls the beads down their rods one step at a time (moving beads are orange). Reading the bead count of each row, top to bottom, gives the sorted array.
- **Bogo Sort**: the page lists 10 distinct random permutations that are not sorted, each marked "not sorted", then the 11th attempt is the sorted sequence. If the array is already sorted, it stops immediately.
- **Counting Sort**: two extra rows appear under the main array. The **count array** (one cell per value from 1 to the maximum, index = value) sits on top of the **position array** (the output). The sort runs in three animated phases: each value is counted, the counts are turned into prefix sums one cell at a time (cells that don't change go by faster), then the values are placed right to left, which keeps the sort stable. While placing, the count cell for each value shows its next free position and counts down. Empty counts are greyed out.
- **Heap Sort**: the heap is drawn as a binary tree to the left of the array (above it on narrow screens). Compared nodes light up in both the tree and the array. After each root swap the largest value leaves the tree and takes its place at the end of the array.
- **Pigeonhole Sort**: values are dropped into holes numbered `value - min`; duplicates share a slot. The holes are then walked in order and each value is written back into the array. Large ranges flow into up to four columns.
- **Radix Sort**: ten buckets sit under the array. Each pass distributes values by one digit (1s, 10s, ...) and collects them back in bucket order; a label shows the current pass.
- **Sleep Sort**: a digital HH:MM:SS timer ticks in virtual seconds (1 tick = 1 second). When the timer reaches a value, that value moves to the output row. Quiet seconds tick by faster.

## Controls

| Control | What it does |
|---|---|
| **Array values** box | Type values separated by commas; brackets are optional. Press Enter or **Set**. |
| **Random** | Generates 5 to 8 distinct random values. |
| **Run** | Starts (or restarts) the animation from the beginning. |
| **◀ Prev** | Goes back one step. |
| **Pause / Resume** | Pauses playback; Resume continues from the step you are on. |
| **Next ▶** | Goes forward one step. Works before Run too, to step through manually. |
| **Reset** | Returns to the entered array and clears the run. |
| **Sorting algorithm** | Drop-down of all 16 algorithms. |
| **Speed** | Slider from slow to fast. |

Prev and Next pause playback automatically. Every step is recorded, so after a sort finishes you can still step back through the whole thing. The entry box and algorithm selector are locked while a run is in progress; press Reset to change them.

### Input rules

- Whole numbers from 1 to 99
- Between 2 and 15 values
- Duplicates are allowed

Anything else shows a short error message under the entry box.

## How it works

Each algorithm is a JavaScript generator that changes a shared state object and `yield`s after every visible step. The runner records a snapshot of the state at each yield, and the page always draws from a snapshot. That is what makes Prev and Next possible without re-running anything. A generator may also yield a number to speed up or slow down its own step (Sleep Sort uses this for quiet ticks).

## Notes on the source code

The algorithms are ports of `sorting.md`, with these deliberate differences:

- **Quick Sort** uses the same Lomuto partition but works in place on index ranges. The original recurses on list slices, which are copies, so it partitions only once and never fully sorts.
- **Radix Sort** skips the final pass the original runs after every digit has been processed, since that pass changes nothing.
- **Bogo Sort** builds every permutation with the original `permutation` function for up to 8 values; above that it samples random permutations instead.
- **Pigeonhole Sort** stores the values in each hole (the original only counts them) so they can be drawn.
- **Sleep Sort** uses a virtual clock instead of real `time.sleep` calls.
- **Bead Sort** and **Heap Sort** are not in `sorting.md`; they were written for this page.

## File

- `sorting_visualizer.html`: the whole application
