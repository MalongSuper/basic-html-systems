# Linear Regression Simulator

An interactive, single-file web app for exploring linear regression. Enter or drag data points and watch the best-fit line (2D) or plane (3D), the correlation coefficient, and the error metrics update instantly.

No installation, libraries, or internet connection needed. Just open `linear_regression_simulator.html` in any modern browser.

---

## What is Linear Regression?

Linear regression is a method for modeling the relationship between variables by fitting a straight line (or flat plane) through data. It answers questions like *"as X increases, how much does Y change?"* and lets you predict Y for a new X.

### Simple linear regression (2D)

One input `X` and one output `Y`. The model is a line:

```
ŷ = b·x + a
```

- `b` is the **slope**: how much `ŷ` changes when `x` increases by 1.
- `a` is the **intercept**: the predicted value when `x = 0`.

The line is chosen by **least squares**, which minimizes the sum of the squared vertical distances between each point and the line:

```
b = Σ(x − x̄)(y − ȳ) / Σ(x − x̄)²
a = ȳ − b·x̄
```

### Multiple linear regression (3D)

Two inputs `X`, `Y` and one output `Z`. The model is a plane:

```
ẑ = a + b₁·x + b₂·y
```

It is fitted with the same least-squares idea, minimizing the squared vertical distances from the points to the plane.

### Residuals (errors)

A **residual** is the gap between the actual value and the predicted one (`y − ŷ`, or `z − ẑ`). A good fit has small residuals scattered randomly around zero.

### Metrics shown in the simulator

| Metric | Meaning |
|---|---|
| **r** (2D) | Pearson correlation coefficient, from −1 (perfect negative) to +1 (perfect positive). Near 0 means no linear relationship. |
| **R** (3D) | Multiple correlation coefficient, from 0 to 1: how well X and Y *together* explain Z. |
| **R²** | Share of the variation in the output explained by the model (0 to 1). |
| **MSE** | Mean squared error: average of the squared residuals. Penalizes large errors heavily. |
| **MAE** | Mean absolute error: average size of the residuals, in the same units as the output. |
| **RMSE** | Root of the MSE: a typical error size, in the same units as the output. |

---

## What the Simulator Does

### Input panel (left)

- **2D / 3D toggle.** Switch between `X, Y` data (fitting a line) and `X, Y, Z` data (fitting a plane). Each mode keeps its own data.
- **Number of records.** Type a count and press Enter to add or remove rows (up to 500).
- **Editable data table.** Click any cell to type a value. Press Enter to move down a column (on the last row it adds a new record). Use **×** to delete a row.
- **Buttons.** **+ Add record**, **Random** (generates a fresh noisy dataset), and **Clear**.

Rows with a missing value are ignored until completed. A line needs at least 2 complete points, and a plane at least 3.

### Simulation panel (right)

- **Scatter plot with regression.** Data points are **blue**, the regression line (or plane) is **red**.
- **2D interactions:**
  - Hover a point to see its X, Y, predicted ŷ, and residual.
  - Hover the line to read the predicted ŷ at any x.
  - The cursor's data coordinates are shown under the plot.
  - **Drag a point** to move it, and the table, line, and statistics update live.
- **3D interactions:** drag to rotate, scroll to zoom, hover a point for its coordinates and residual, and use **Reset view** to restore the default angle.
- **Show error lines.** A checkbox that draws a **purple** line from each point to the regression line (or plane), making each residual visible.

### Results (below the plot)

- The fitted equation (`ŷ = bx + a` or `ẑ = a + b₁x + b₂y`).
- **Correlation coefficient** (bottom right), with a plain-language description of its strength and direction.
- Supporting values: slope/intercept, R², **MSE, MAE, RMSE**, and in 3D the pairwise correlations r(X,Z), r(Y,Z), r(X,Y).

If a fit is impossible (too few points, all X values identical, or X and Y collinear in 3D), the app shows a message instead of a result.

---

## Things to Try

- Drag one point far from the others and see how much the line, r, and RMSE change. A single outlier can have a large effect.
- Make all points lie exactly on a line: r reaches ±1 and the errors drop to 0.
- Spread points randomly: r drops toward 0 and R² becomes small.
- Turn on **Show error lines**, then drag points and watch the purple lines shrink as the fit improves.
- Compare MAE and RMSE. A big gap between them means a few large errors dominate.

---

## Notes

- Everything lives in one HTML file (HTML, CSS, and vanilla JavaScript on a `<canvas>`).
- Correlation measures *linear* association only. A high r does not prove that X causes Y, and a curved relationship can have a low r even when the variables are strongly related.
