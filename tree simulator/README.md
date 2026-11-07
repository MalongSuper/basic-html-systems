# Tree Data Structure Simulator

A single-file, dependency-free HTML page (`tree-simulator.html`) that lets you **build, search, balance, traverse and sort tree data structures** and watch every step animate. Open the file in any modern browser; there is nothing to install.

- Value inputs and controls are on the **left**.
- The live tree is drawn on the **right** (canvas, plain white background).
- Under the tree you get the **tree type** (Full / Complete / Perfect), the **array representation**, and the **traversal output**.

---

## What the system does

| Area | What you get |
|---|---|
| **Construct** | Type a list of values (commas or spaces) and press **Build tree**, or use **Random**. Add or remove single values with **Insert / Delete / Search**. |
| **Switch structure** | Binary Tree, BST, AVL Tree, Min Heap, Max Heap. Switching keeps your values and rebuilds them in the new structure, so nodes slide to their new positions. |
| **Classify** | Reports whether the current tree is **Full**, **Complete** and/or **Perfect**, with the reason (for example "30 has only a left child"). Also shows node count, height, whether it is height-balanced, and whether the BST or heap property holds. |
| **Array view** | Shows the tree as an array using the standard index rule, with gaps drawn as dashed cells. |
| **Traversals** | Animated In-order, Pre-order, Post-order and Level-order. The visit order builds up below the tree. |
| **Heaps** | Insert, delete, **Extract min/max**, **Heapify** (bottom-up build) and **Heap sort**. |
| **Playback** | Every operation is recorded as steps. Use Play / Pause, Step back and forward, jump to first or last, a speed slider, or untick **Animate steps** to jump straight to the result. |

### Colour legend

| Colour | Meaning |
|---|---|
| Amber | Comparing |
| Light green | New node |
| Green | OK / found / in place |
| Blue | Currently visiting (traversals) |
| Indigo | Already visited |
| Purple | Moved, swapped or rotated |
| Red | Unbalanced, being removed, or not found |
| Pale blue outline | On the current path |

Small **L** and **R** labels mark left and right edges. In AVL mode the small number beside each node is its balance factor.

---

## The tree types

### Binary Tree

A tree in which every node has **at most two children**, a left and a right. There is no ordering rule.

In this simulator, values are placed **level by level, left to right**, so a plain list of values always produces a *complete* tree. To make other shapes, type `null` (also `x`, `#`, `_`, `-`) to leave a gap:

```
1, 2, 3, null, 5
```

This puts 5 as the right child of 2. A value whose parent slot is `null` is dropped.

- **Insert:** goes to the next free slot in level order.
- **Delete:** the node is swapped with the last node in level order, which is then removed.
- **Search:** a linear scan in level order, O(n), because nothing is ordered.

### Binary Search Tree (BST)

A binary tree with an ordering rule: for every node, everything in the **left** subtree is **smaller** and everything in the **right** subtree is **larger**.

- **Insert / search:** compare with the current node and go left or right until you find the value or an empty slot.
- **Delete:** a leaf is removed. A node with one child is replaced by that child. A node with two children is replaced by its **in-order successor** (the smallest value in its right subtree).
- **Cost:** O(log n) on average, but **O(n) in the worst case**. Inserting already-sorted values (try `1,2,3,4,5`) makes a tall, skinny chain.
- Duplicates are ignored.

### AVL Tree

A BST that **balances itself**. For every node, the **balance factor** `height(left) − height(right)` must be **−1, 0 or +1**. After an insert or delete, the simulator walks back up the path, checks each ancestor, and rotates when a factor reaches ±2:

| Case | Cause | Fix |
|---|---|---|
| Left-Left | Left child is left-heavy | One right rotation |
| Right-Right | Right child is right-heavy | One left rotation |
| Left-Right | Left child is right-heavy | Rotate left at the child, then right at the node |
| Right-Left | Right child is left-heavy | Rotate right at the child, then left at the node |

- **Cost:** insert, delete and search are all **O(log n)**, even for sorted input.
- Tip: build `10,20,30,40,50,60,70` in **BST** (a chain), then click **AVL Tree** to see the same values rebalance into a perfect tree.

### Min Heap

A **complete** binary tree where every parent is **less than or equal to** its children, so the **root is the minimum**. Note that a heap is *not* a BST: left and right children have no ordering relative to each other.

- **Insert:** append at the end of the array, then **sift up** while smaller than its parent.
- **Extract min:** swap the root with the last element, remove it, then **sift down** the new root, always swapping with the *smaller* child.
- **Heapify:** builds a heap from a raw array in **O(n)** by sifting down from the last parent to the root.

### Max Heap

The mirror image: every parent is **greater than or equal to** its children, so the **root is the maximum**. Sift-up and sift-down use "larger" instead of "smaller".

### Heap Sort

Available in both heap modes. Repeatedly remove the root, place it at the **right end** of the sorted row, and sift down to repair the heap.

- A **Max Heap** gives **ascending** order.
- A **Min Heap** gives **descending** order.
- Cost: **O(n log n)**. Your heap is left unchanged afterwards.

---

## Tree type: Full, Complete, Perfect

These describe the **shape** of a binary tree, not its contents.

| Type | Rule | Example (values in a BST) |
|---|---|---|
| **Full** | Every node has **0 or 2** children. | `50,30,70,60,80` |
| **Complete** | Every level is full except possibly the last, and the last level fills **left to right** with no gaps. | `50,30,70,20,40,60` |
| **Perfect** | Every internal node has 2 children and **all leaves are on the same level**. A perfect tree of h levels has 2^h − 1 nodes. | `50,30,70,20,40,60,80` |

They overlap: a **perfect** tree is always full *and* complete. A tree can be full but not complete, complete but not full, or neither. Heaps are always complete by definition.

---

## Array representation

Any binary tree can be stored in an array with this indexing (0-based):

```
parent(i) = (i − 1) / 2   (integer division)
left(i)   = 2i + 1
right(i)  = 2i + 2
```

- A **complete** tree (including every heap) packs into the array with **no gaps**, which is why heaps are stored this way in practice.
- A **skinny or unbalanced** tree leaves many **empty slots** (shown as dashed cells). The panel reports the array length against the node count, which shows how much space is wasted.

---

## Traversals

Example tree: BST built from `50, 30, 70, 20, 40, 60, 80`.

| Traversal | Order | Result | Typical use |
|---|---|---|---|
| **In-order** | Left → Root → Right | 20, 30, 40, 50, 60, 70, 80 | On a BST it gives the values **sorted** |
| **Pre-order** | Root → Left → Right | 50, 30, 20, 40, 70, 60, 80 | Copying or serializing a tree |
| **Post-order** | Left → Right → Root | 20, 40, 30, 60, 80, 70, 50 | Deleting a tree (children before parent) |
| **Level-order** | Top to bottom, left to right | 50, 30, 70, 20, 40, 60, 80 | Breadth-first search; on a heap it equals the array |

During playback, nodes on the current recursion path get an outline, visited nodes turn indigo, and the current node is blue.

---

## Quick reference: complexity

| Structure | Insert | Search | Delete | Notes |
|---|---|---|---|---|
| Binary Tree (level-order) | O(1) slot, O(n) to find value | O(n) | O(n) to find value | No ordering |
| BST | O(log n) avg, O(n) worst | O(log n) avg, O(n) worst | O(log n) avg, O(n) worst | Degrades on sorted input |
| AVL Tree | O(log n) | O(log n) | O(log n) | Always balanced |
| Min / Max Heap | O(log n) | O(n) | O(log n) once found | Extract root is O(log n) |
| Heapify | O(n) | – | – | Bottom-up build |
| Heap sort | O(n log n) | – | – | In any heap mode |

---

## Using the page

1. Pick a **Structure**.
2. Enter **Values** and press **Build tree** (or **Random**).
3. Use **One value** to Insert, Delete or Search a single number (Enter key inserts).
4. Run a **Traversal**, or in a heap mode use **Heapify values**, **Extract**, or **Heap sort**.
5. Use the controls under the tree to pause, step through, change speed, or skip to the end.

## Limits and notes

- Up to **63 nodes** are kept so the picture stays readable.
- **BST and AVL ignore duplicates.** The Binary Tree and heaps allow them (switching to BST or AVL drops repeats).
- Values must be numbers (integers, decimals and negatives are fine).
- The step controls only cover the **current operation**; starting a new one replaces it.
