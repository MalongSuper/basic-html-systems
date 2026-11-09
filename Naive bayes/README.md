# Naive Bayes Simulator

A single-file, dependency-free HTML page (`naive-bayes-simulator.html`) for learning how a Naive Bayes classifier works. You enter a labelled dataset, the page learns the model from it, and then classifies a new sample while showing every probability and every step of the calculation. Open the file in any modern browser; there is nothing to install.

- **Left:** choose the model, define features, edit the dataset, and see the learned statistics (class priors, conditional probabilities, smoothing).
- **Right:** enter a new sample and see the log scores, the normalised probabilities and the predicted class.

---

## 1. Naive Bayes explained

### Conditional probability

A **conditional probability** is the probability of one event *given that* another has happened. It is written `P(A | B)` and read "the probability of A given B":

```
P(A | B) = P(A and B) / P(B)
```

In classification the useful ones are of the form `P(feature | class)`: how likely a feature is *within* one class. For example, if 300 of the 400 spam emails contain the word "Free":

```
P(Free | Spam) = 300 / 400 = 0.75
```

Conditional probability is **not symmetric**: `P(Free | Spam)` (how many spam emails contain "Free") is a different number from `P(Spam | Free)` (how many emails containing "Free" are spam). Getting from one to the other is what Bayes' theorem does.

### Bayes' theorem

```
P(H | D) = P(D | H) · P(H) / P(D)
```

| Term | Name | Meaning |
|---|---|---|
| `P(H)` | **Prior** | How likely the hypothesis is before seeing the evidence |
| `P(D \| H)` | **Likelihood** | How likely the evidence is if the hypothesis is true |
| `P(D)` | **Evidence** | How likely the evidence is overall (a normalising constant) |
| `P(H \| D)` | **Posterior** | How likely the hypothesis is after seeing the evidence |

A classic example: a fault affects 2% of devices, a test detects 95% of faulty devices, and 5% of good devices also test positive. For a positive result:

```
P(+)     = 0.95·0.02 + 0.05·0.98 = 0.068
P(F | +) = 0.95·0.02 / 0.068     = 0.2794
```

Only about 28% of positives are real faults, because faults are rare to begin with. The prior matters.

### From Bayes' theorem to a classifier

To classify, treat each class `C` as a hypothesis and the features `X = (x₁, …, xₙ)` as the evidence. Bayes' theorem gives the posterior of every class, and we pick the largest. The evidence `P(X)` is the same for every class, so it does not change which class wins and can be ignored when only ranking classes:

```
P(C | X) ∝ P(C) · P(X | C)
```

The difficulty is `P(X | C)`, the probability of the *whole combination* of feature values within a class. With many features, almost every exact combination appears rarely (or never) in the training data, so it cannot be estimated reliably.

### The term "naive"

Naive Bayes solves that problem with one simplifying assumption: **given the class, all features are independent of each other.** The joint likelihood then breaks into a product of simple one-feature probabilities:

```
P(X | C) = P(x₁ | C) · P(x₂ | C) · … · P(xₙ | C) = Π P(xᵢ | C)
```

This is called "naive" because it is usually false. In a spam email, "Millions" and "Dollars" tend to appear together; they are not independent. Yet the assumption makes learning fast and needs little data (just count each feature per class), and the classifier often ranks classes correctly anyway.

**The price of the assumption:** if two features carry the same information, the model counts that evidence twice and becomes **overconfident**. With a Spam prior of 0.40, `P(Free | Spam) = 0.75` and `P(Free | Not Spam) = 0.10`:

| Evidence | P(Spam \| ...) |
|---|---|
| "Free" counted once | 0.8333 |
| "Free" counted twice (a duplicated feature) | 0.9740 |

The probabilities from Naive Bayes are therefore best read as a **ranking** of the classes, not as perfectly calibrated confidence.

### The formula

```
Ĉ = argmax over C of   P(C) · Π P(xᵢ | C)
```

1. **Prior** `P(C) = n_C / N`: the share of training samples in class C.
2. **Likelihoods** `P(xᵢ | C)`: estimated from the training data, in a way that depends on the model variant (below).
3. **Score** of each class = prior × product of likelihoods.
4. **Normalise** (optional) to turn scores into probabilities that sum to 1: `P(C | X) = Score(C) / Σ Score`.
5. **Predict** the class with the highest score.

**Worked example** (two binary features, 1,000 emails: 400 Spam and 600 Not Spam). A new email contains "Free" and "Win":

| | Spam | Not Spam |
|---|---|---|
| Prior `P(C)` | 0.40 | 0.60 |
| `P(Free \| C)` | 0.75 | 0.10 |
| `P(Win \| C)` | 0.60 | 0.05 |
| **Score** | 0.40·0.75·0.60 = **0.18** | 0.60·0.10·0.05 = **0.003** |
| **Posterior** | 0.18 / 0.183 = **98.36%** | 1.64% |

The scores are not probabilities (0.18 + 0.003 ≠ 1). Dividing by their sum gives the true posteriors.

#### Log scores

Multiplying many small probabilities underflows to 0 on a computer (1,000 factors of 0.001 is far below the smallest representable number). Because `log` turns products into sums and preserves the ranking, implementations work with **log scores**:

```
log score(C) = log P(C) + Σ log P(xᵢ | C)
```

For the example above: `log 0.18 = −1.7148` and `log 0.003 = −5.8091`. To get probabilities back, the simulator subtracts the largest log score `m` before exponentiating (the *log-sum-exp* trick), which avoids underflow:

```
P(C | X) = exp(log score(C) − m) / Σ exp(log score − m)
```

#### The three variants

The variants differ only in how `P(xᵢ | C)` is modelled, and therefore in what kind of feature they expect:

| Variant | Feature type | Typical use | How `P(xᵢ \| C)` is estimated |
|---|---|---|---|
| **Multinomial** | Non-negative integer **counts** | Word counts in documents | `θ = (count of feature in C + α) / (total count in C + α·d)`; a count `x` contributes `x · log θ` |
| **Gaussian** | **Real numbers** | Measurements (e.g. flower sizes) | Normal density with the class mean μ and variance σ²: `exp(−(x−μ)²/2σ²) / √(2πσ²)` |
| **Bernoulli** | **Binary** 0 / 1 | Word present or absent | `P(x=1 \| C) = (count of 1s + α) / (n_C + 2α)` and `P(x=0 \| C) = 1 − P(x=1 \| C)`. Absence counts as evidence too |

Here `d` is the number of features and `α` is the smoothing strength (next section).

### Laplace smoothing

**The problem.** If a feature never appears in a class in the training data, its estimated probability is exactly 0. Because the score is a *product*, a single 0 wipes out everything else: any new sample containing that feature gets a score of 0 for that class (log score `−∞`), however strong the other evidence is. This is the **zero-frequency problem**. For example, if the word "prize" never occurs in the Not Spam training emails, no email containing "prize" can ever be classified as Not Spam.

**The fix.** Add a small constant `α` to every count, so nothing is ever exactly zero:

```
P(w | C) = (N_w,C + α) / (N_C + α·|V|)
```

where `N_w,C` is the count of feature `w` in class `C`, `N_C` is the total count in `C`, and `|V|` is the number of features (the vocabulary size).

- `α = 1` is **Laplace smoothing**. Values between 0 and 1 are called Lidstone smoothing; `α = 0` means no smoothing.
- Example: "prize" occurs 0 times among 100 word occurrences in a class, with a vocabulary of 50 words. Without smoothing the probability is `0 / 100 = 0`. With Laplace smoothing it is `(0 + 1) / (100 + 1·50) = 0.00667`.
- Smoothing also pulls estimates from tiny samples toward a uniform guess, which reduces over-fitting. A larger `α` smooths more strongly and makes the predictions less extreme.

**Gaussian models** have no zero counts, but they have an analogous problem: a feature that is constant inside a class has variance 0, which makes its bell curve infinitely narrow. The fix is **variance smoothing**: add a small `ε × (largest feature variance)` to every variance (scikit-learn's default is `ε = 10⁻⁹`).

---

## 2. Features of the simulator

### Left side: build and inspect the model

| Area | What you can do |
|---|---|
| **Model** | Switch between **Multinomial** (the default), **Gaussian** and **Bernoulli**. A short description explains what each expects. |
| **Feature types follow the model** | The feature type shown next to **Features** changes with the model: counts (integers ≥ 0), real numbers, or binary 0 / 1. The table cells change to match. Existing values are converted: counts are rounded (negatives become 0), or binarised (anything above 0 becomes 1) for Bernoulli. Switching back **before you edit anything** restores your original values. |
| **Features** | Add features by name, rename them in place, or remove them. Names must be unique (ignoring case). Name the class column too (for example `Class` or `Species`). |
| **Dataset** | An editable table. Add or delete records, or clear them all. Incomplete rows are marked amber and ignored until completed; invalid cells (for example 2.5 in a count column) are marked red. A status line tells you how many records are being used. |
| **Count column** | Each row has a **Count**: how many identical records it stands for. This lets a grouped table (such as "180 spam emails with Free and Win") be entered in one row instead of 180. |
| **Examples** | A dropdown loads ready-made data: the **spam filter** (12 word-count emails, Multinomial), the **Free / Win emails** (1,000 emails in 8 grouped rows, Bernoulli) and **Iris flowers** (15 measurements, Gaussian). |
| **Classes and priors** | The number of unique classes, the number of samples in each, and each class prior `P(C) = n_C / N`, with a bar for each. |
| **Conditional probabilities** | A table of `P(feature \| class)` for every feature and class, with the formula in use shown above it and the raw counts under each probability (Gaussian shows each class's mean and variance instead). An **All classes** column gives the overall values for reference. |
| **Smoothing check** | States whether smoothing is **required** for the dataset (it is when any estimate would be exactly 0, or 0 / 1 for Bernoulli, or any variance is 0 for Gaussian) and lists exactly which features are affected in which class. If smoothing is required but switched off, a red warning appears. Set **α** (or **ε** for Gaussian) with the input or the quick buttons (`α = 0` for none, `α = 1` for Laplace). |

### Right side: classify a new sample

| Area | What you can do |
|---|---|
| **New sample** | Enter a value for every feature using the input type that matches the model. For Multinomial and Bernoulli you can also type a **message**: the words found among the features fill in the counts (or presence flags), and unknown words are listed and ignored. **Reset sample** puts it back to zeros (or to the training means for Gaussian). |
| **Prediction** | The **predicted class**, its probability, and a bar for every class. Three lines spell out the method: the log scores, the normalisation (with the log-sum-exp constant and log evidence), and the final choice. |
| **Calculation by hand** | A table of every term: the prior and each feature's `P(xᵢ \| C)`, each shown as a probability with its logarithm underneath; then the **log score** (sum), the **score** (`e^log score`, flagged as not a probability) and the **posterior** (normalised). The winning column is highlighted. For Multinomial only features with a count above 0 are listed, since a count of 0 contributes nothing. |
| **Edge cases** | With `α = 0`, a zero probability shows as `0` and its log as `−∞`. If every class gets `−∞`, the page says no prediction is possible and points to smoothing. |

Everything updates live: edit a cell, change the model or change α and the statistics, the log scores and the prediction recompute immediately.

---

## Quick start

1. Open `naive-bayes-simulator.html`. The 12-email spam filter is already learned, and "limited class offer" is entered.
2. Read the prediction: **Spam at 75.00%**. Scroll to **Calculation by hand** to see where that number comes from.
3. Look at **Smoothing**: it is required, because words like "prize" never occur in the Not Spam emails. Click **α = 0 (none)** and enter "free meeting": both classes become impossible. Click **α = 1 (Laplace)** to fix it.
4. Load **Free / Win emails** to reproduce the worked example above (98.36% Spam, no smoothing needed), then try the **Iris** example with the Gaussian model.
5. Switch the model to see how the feature types change, or edit the data to build your own classifier.

## Notes and limits

- Class names are matched ignoring case and surrounding spaces ("Spam" and " spam" are one class).
- Class priors are the empirical proportions (`n_C / N`) and are not smoothed. Smoothing applies to the feature probabilities.
- Gaussian variances are population variances (divide by n), with `ε × max variance` added, as in scikit-learn's `GaussianNB`. A variance is never allowed below `10⁻¹²`.
- Count must be a whole number of at least 1.
- The default `α` is 1, as in scikit-learn. The Free / Win example loads with `α = 0` so its numbers match the hand calculation above.
- The simulator holds up to 500 rows.
- The probabilities were checked against scikit-learn's `MultinomialNB`, `BernoulliNB` and `GaussianNB` on the bundled examples and agree to rounding error.
