# K-Means Clustering Simulator

The K-Means Clustering Simulator is a small, interactive, browser-based tool for exploring how the K-Means algorithm groups data points. Open [`kmeans_simulator.html`](./kmeans_simulator.html) in a modern web browser to get started; no installation or build step is required.

## What is K-Means Clustering?

K-Means is an unsupervised machine-learning algorithm that divides data points into a chosen number of groups, called clusters. Each cluster is represented by a **centroid**, the mean position of the points assigned to it.

The algorithm works iteratively:

1. Choose *K* initial centroids.
2. Assign each point to its nearest centroid.
3. Recalculate each centroid as the mean of its assigned points.
4. Repeat the assignment and recalculation until the clusters stop changing.

## Main features

- **Explore in 2D or 3D:** Switch between plotting X/Y and X/Y/Z data. In 3D, drag the plot to rotate it and scroll to zoom.
- **Create and edit data:** Generate clustered blobs or a uniform scatter, choose the number of records (up to 500), edit coordinates in the table, add records, or delete them.
- **Configure K-Means:** Choose the number of centroids (up to 32) and initialize them using random samples or K-means++.
- **Control the algorithm:** Advance one iteration at a time with **Step**, run or pause the simulation, adjust its speed, or reinitialize the centroids.
- **See cluster assignments:** Points are colored by cluster, centroids are marked on the plot, and the cluster legend shows the number of assigned points.
- **Inspect and measure:** Hover over a point or centroid for details. Click two data points to measure the distance between them.
- **Customize the plot:** Toggle centroid paths, lines from points to their centroids, and equal axis scaling.
- **Track progress:** View the current iteration, inertia (sum of squared errors), and algorithm status.
