# KNN Visualizer

An interactive, single-file tool for seeing how **k-Nearest Neighbors (KNN)** works.
Open `knn_visualizer.html` in any browser. There is nothing to install and it works offline.

## What is KNN?

To predict a new point, KNN finds the **K closest points** in the data and lets them decide:

- **Classification**: the most common label among the K neighbors wins.
- **Regression**: the answer is the average value of the K neighbors.

## What this page does

- **Left side**: pick a dataset, choose 2D or 3D, choose which features go on the axes, set the number of records, randomize the data, and edit any value in the table.
- **Right side**: a scatter plot of the data, colored by label. Add *query points* (diamonds) and watch KNN classify them.

## Datasets

All start with 100 samples. **Randomize data** draws a fresh random sample.

| Dataset | Type | Source |
|---|---|---|
| Breast Cancer | binary (benign / malignant) | Wisconsin Diagnostic, 569 tumours |
| Heart Disease | binary (no disease / disease) | Cleveland, 303 patients |
| Iris | 3 classes | Fisher's Iris, 150 flowers |
| XOR | binary | generated (class 1 when x and y have opposite signs) |
| House Prices | regression | California Housing 1990 (price in $1000s) |

## How to use it

1. **Add a query point**: click *+ Random query point*, or tick *Click plot to place query* (2D only) and click the plot. The diamond takes the predicted color.
2. **Click the diamond** to see its K nearest neighbors, the distance to each one, and the vote.
3. **Hover** any point to see its label and values. Click **two points** to see the distance between them.
4. Change **K**, the **distance** (Euclidean or Manhattan), or **voting** (uniform or weighted by 1/distance) and watch the predictions change.
5. Turn on **Decision regions** (2D) to see how the plot is split into predicted areas.

## Good to know

- **K** defaults to 3. The maximum is 32, or half the number of samples if the data is small.
- Distance only uses the **features on the axes** (2 or 3), so what you see is what KNN uses.
- **Normalize features** (on by default) rescales each feature to 0-1 so one large-unit feature does not dominate.
- **Leave-one-out accuracy** (RMSE for house prices) shows how well the current K does on the data. Try different K values to compare.
- If votes tie, the class of the closest neighbor wins.
