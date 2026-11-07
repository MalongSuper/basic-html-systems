# Decision Tree Simulator

A single-file, dependency-free HTML page (`decision-tree-simulator.html`) for learning how a decision tree is built. You describe your own data, press **Build tree**, and the page grows the tree with **ID3** and lets you inspect the calculation behind every split. Open the file in any modern browser; there is nothing to install.

- **Left:** define features, choose the target, and edit the dataset.
- **Right:** the resulting tree. Nodes show only the feature (or the prediction in a leaf); **hover** a node to see the Information Gain or Standard Deviation Reduction behind it, and **click** to hold that tooltip.

---

## 1. Decision Tree: what is it?

A decision tree is a supervised machine-learning model that makes a prediction by asking a series of questions about the input, one feature at a time. It is drawn as a flowchart-shaped tree:

| Part | Meaning |
|---|---|
| **Root node** | The first question, using the most informative feature. |
| **Internal node** | A question about one feature (for example "Age?"). |
| **Branch** | One possible answer to the question (for example `≤30`, `31…40`, `>40`). |
| **Leaf node** | The final prediction. No more questions are asked. |

To predict a new record, start at the root, follow the branch that matches the record's value at each node, and stop at a leaf. The leaf is the answer.

**Two kinds of decision tree**

| Type | Target | Leaf predicts |
|---|---|---|
| **Classification tree** | A category (yes / no, spam / not spam, ...) | The majority class of the training records in that leaf |
| **Regression tree** | A number (price, hours played, ...) | The mean of the training values in that leaf |

**Example** (the notebook's dataset: will this person buy an Xbox?)

```
Age
├─ ≤30    → Student
│            ├─ Yes → yes
│            └─ No  → no
├─ 31…40  → yes
└─ >40    → Credit_Rating
             ├─ Fair      → yes
             └─ Excellent → no
```

**Why people like them:** they are easy to read and explain, need little data preparation, and handle both categorical and numeric features.

**Their weak spot:** left to grow until every leaf is pure, a tree memorises its training data (overfitting). Limiting the depth, or pruning the tree afterwards, helps.

The central question when growing a tree is: **which feature should be asked first?** That is what ID3 answers.

---

## 2. ID3

**ID3** (Iterative Dichotomiser 3) was introduced by J. Ross Quinlan in 1986. It builds the tree **top-down and greedily**. At every node it picks the feature that separates the target best, splits the records by that feature's values, and repeats on each branch.

### Entropy: how mixed is a set?

Entropy measures impurity. It is 0 when every record has the same class and highest when classes are evenly mixed.

```
Entropy(S) = − Σ pᵢ · log₂(pᵢ)          pᵢ = share of records in class i
```

For the Xbox data (9 "yes", 5 "no"): `Entropy(S) = 0.9403`.

### Information Gain: how much does a split help?

For a feature, split S into subsets Sᵥ (one per value), take the **weighted average entropy** after the split, and subtract it from the entropy before:

```
Weighted(S, F)  = Σ (|Sᵥ| / |S|) · Entropy(Sᵥ)
IG(S, F)        = Entropy(S) − Weighted(S, F)
```

The feature with the **highest Information Gain** becomes the split.

**Worked example: choosing the root**

| Age value | Records | yes / no | Entropy |
|---|---|---|---|
| ≤30 | 5 | 2 / 3 | 0.9710 |
| 31…40 | 4 | 4 / 0 | 0.0000 |
| >40 | 5 | 3 / 2 | 0.9710 |

```
Weighted(Age) = 5/14·0.9710 + 4/14·0 + 5/14·0.9710 = 0.6935
IG(Age)       = 0.9403 − 0.6935 = 0.2467
```

Doing the same for every feature:

| Feature | Information Gain |
|---|---|
| **Age** | **0.2467** (chosen) |
| Student | 0.1518 |
| Credit_Rating | 0.0481 |
| Income | 0.0292 |

### The algorithm

1. If every record in the node has the same target value, make a **leaf** with that value.
2. If there is no feature left to split on, make a leaf with the **majority** target value.
3. Otherwise compute the Information Gain of each remaining feature and pick the best one (ties go to the feature listed first).
4. Create one branch per value of that feature, send the matching records down each branch, and **repeat from step 1** on each branch. A categorical feature is not used again below the node that used it.

### ID3 for regression: Standard Deviation Reduction (SDR)

When the target is a number, entropy no longer applies. The same procedure is used with **standard deviation** as the measure of impurity:

```
SD(S)  = sqrt( Σ (y − mean)² / n )
SDR    = SD(S) − Σ (|Sᵥ| / |S|) · SD(Sᵥ)
```

The feature with the **highest SDR** is chosen. A node becomes a leaf when its SD is zero (or below a threshold you set), and the leaf predicts the **mean** of its values. This is also the idea behind regression trees such as Quinlan's M5.

**Worked example** (golf hours played, 14 records): `SD(S) = 9.32`. Splitting on Outlook:

| Outlook | n | mean | SD |
|---|---|---|---|
| Rainy | 5 | 35.20 | 7.78 |
| Overcast | 4 | 46.25 | 3.49 |
| Sunny | 5 | 39.20 | 10.87 |

```
Weighted SD = 5/14·7.78 + 4/14·3.49 + 5/14·10.87 = 7.66
SDR(Outlook) = 9.32 − 7.66 = 1.66    ← largest of all features, so Outlook is the root
```

### Limits of plain ID3 (and what this simulator does about them)

- **Categorical features only.** For **Integer** and **Numerical** features the simulator splits in two at the best threshold (`≤ t` / `> t`), choosing `t` that maximises the gain, in the style of C4.5. Numeric features can be reused further down the tree.
- **No pruning.** The tree grows until pure, so it can overfit. Use the **Max depth** option to keep it small.
- **Favours features with many values**, because many small subsets look pure by chance.

---

## 3. Features of the system

### Building the model (left side)

| Area | What you can do |
|---|---|
| **Features** | Add features with a name and a type: **Boolean** (Yes / No), **String**, **Integer** or **Numerical value**. Rename, retype or remove them at any time. Names must be unique. |
| **Target** | Name the target and choose **Classification** (ID3 · Information Gain) or **Regression** (ID3 · Standard Deviation Reduction). Switching modes keeps your data. |
| **Dataset** | An editable table. Add records, edit any cell (each column uses an input that matches its type), delete a record, or clear them all. String columns suggest values already used. |
| **Examples** | A dropdown loads ready-made data: the notebook's **Buy XBOX** set, **Play Tennis** (categorical), **Play Tennis** (numeric values), and **Golf hours played** (regression). |
| **Options** | **Max depth** (blank = unlimited) and, for regression, **Stop when SD ≤** a value you choose. |
| **Build tree** | Validates the data and grows the tree. Empty or invalid cells are highlighted in red with a message naming the record and column. |

### Reading the tree (right side)

| Feature | Description |
|---|---|
| **Clean nodes** | A split node shows only its feature name. A leaf shows only the prediction. Edge labels show the value taken (`≤30`, `Yes`, `≤ 77.5`, ...). |
| **Colours** | Classification leaves are coloured by class (green for yes, red for no, other colours for other classes). Regression leaves are shaded from low to high predicted value. A legend sits in the header strip. |
| **Hover tooltip** | Hover a split node to see the split feature, its **Information Gain** or **SDR**, the formula worked out with the actual numbers, a per-branch table (count, class counts or mean, entropy or SD, weight), and the gain of **every candidate feature** at that node with the chosen one in bold. A threshold split shows its threshold. Hover a leaf to see its prediction, the records it holds, and why the branch stopped. |
| **Hold a tooltip** | **Click a node to hold its tooltip.** It stays beside the node and keeps working while you hover other nodes to compare. Click another node to move the hold to it (it resets), click the same node again, click empty space, or press **Esc** to release. The held tooltip follows its node when you zoom or scroll, and rebuilding the tree clears it. |
| **Path and records** | Hovering or holding a node highlights the path back to the root and the dataset records that reach that node. |
| **Zoom** | **−**, **Fit** and **+** buttons. Wide trees keep readable text and scroll instead of shrinking away. |
| **Summary strip** | Node, leaf and depth counts, the root split with its gain, and the **training accuracy** (classification) or **RMSE** and **R²** (regression). It warns you when the data has changed since the last build. |

---

## Quick start

1. Open `decision-tree-simulator.html`. The Buy XBOX example is already built.
2. Hover the root node to see the Information Gain calculation, then click it to hold the tooltip.
3. Choose another example from **Load an example…**, or edit the data and press **Build tree**.
4. To use your own data: add features, set the target and its mode, fill in the records, then press **Build tree**.

## Notes

- Text values are matched ignoring case and surrounding spaces ("Yes" and " yes" count as the same value).
- Integer values must be whole numbers; Numerical values may be decimals.
- Standard deviation uses the population formula (divide by n), as in the worked example above.
- The simulator holds up to 500 records.
