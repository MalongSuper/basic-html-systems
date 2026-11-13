
# Graph

```
def adjacency_matrix(V):
    # Create a zero matrix of order v x v
    M = np.zeros((V, V))
    for i in range(V):
        for j in range(V):
            if i < j:
                # If the edge exists in the graph, refer it as 1
                # Else, refer it as 0
                e = eval(input(f"+ Enter edge from {i} to {j} (1 or 0): "))
                while (e != 0) and (e != 1):
                    print("Invalid Input")
                    e = eval(input(f"+ Enter edge from {i} to {j} (1 or 0): "))
                M[i, j] = e  # Store the value in the matrix
                # Since it is symmetrical, we can assign matrix[j, i]
                # with the value stored in matrix[i, j]
                M[j, i] = M[i, j]
    return M  # Return the matrix
```


```
def find(parent, u):  # Find the representative (or root) of a node
    if parent[u] != u:
        parent[u] = find(parent, parent[u])  # Path compression
    return parent[u]


def union(parent, rank, u, v):  # Unite two sets
    root_u = find(parent, u)
    root_v = find(parent, v)
    if root_u != root_v:
        # Union by rank
        if rank[root_u] > rank[root_v]:
            parent[root_v] = root_u
        elif rank[root_u] < rank[root_v]:
            parent[root_u] = root_v
        else:
            parent[root_v] = root_u
            rank[root_u] += 1


def kruskal_algorithm(V, M):  # Apply Kruskal's algorithm
    edges = []
    # Create an edge list from the adjacency matrix
    for i in range(V):
        for j in range(i + 1, V):
            if M[i][j] != 0:  # If there is an edge
                edges.append((M[i][j], i, j))
    # Sort edges by weight
    edges.sort()
    # Initialize the parent and rank for union-find
    parent = list(range(V))
    rank = [0] * V
    mst = []
    mst_weight = 0
    for weight, u, v in edges:
        # Find the roots of u and v
        if find(parent, u) != find(parent, v):
            # If they belong to different sets, add the edge to the MST
            mst.append((u, v, weight))
            mst_weight += weight
            # Union the two sets
            union(parent, rank, u, v)
    return mst, mst_weight
```

```
def prim_algorithm(V, matrix):
    # Initializing structures
    key = [float('inf')] * V  # The minimum weight edge to connect a vertex to the MST
    parent = [-1] * V  # Array to store the constructed MST
    in_mst = [False] * V  # Keep track of vertices included in MST
    key[0] = 0  # Start with vertex 0
    for _ in range(V):
        # Find the vertex with the minimum key value that is not yet included in MST
        u = min((key[i], i) for i in range(V) if not in_mst[i])[1]
        in_mst[u] = True  # Include u in MST
        # Update the key value and parent for the adjacent vertices
        for v in range(V):
            if matrix[u][v] != 0 and not in_mst[v] and matrix[u][v] < key[v]:
                key[v] = matrix[u][v]
                parent[v] = u
    mst_edges = []
    mst_weight = 0
    # Collect edges in the MST
    for i in range(1, V):
        if parent[i] != -1:
            mst_edges.append((parent[i], i, matrix[parent[i]][i]))
            mst_weight += matrix[parent[i]][i]
    return mst_edges, mst_weight
```

```
def insert_edge(M, i, j):  # Insert an edge in the matrix
    M[i, j] = 1
    M[j, i] = 1  # For undirected graph


def delete_edge(M, i, j):  # Delete an edge in the matrix
    M[i, j] = 0
    M[j, i] = 0  # For undirected graph

def insert_vertex_from_matrix(M, v):
    # Insert the row and column of the removed vertex
    result_matrix = np.insert(np.insert(M, v, 0, axis=0), v, 0, axis=1)
    return result_matrix


def delete_vertex_from_matrix(M, v):
    # Delete the row and column of the removed vertex
    result_matrix = np.delete(np.delete(M, v, axis=0), v, axis=1)
    return result_matrix
```

```
def depth_first_search(visited_list, graph, node):  # Apply Recursion for DFS
    if node not in visited_list:
        print(node)
        visited_list.add(node)  # Add the node to the visited list
        for n in graph[node]:
            # Move to the neighboring vertices
            depth_first_search(visited_list, graph, n)


def breadth_first_search(visited_list, graph, node):
    queue = []  # Initialize the queue
    visited_list.append(node)
    queue.append(node)
    # Iterate each node in the queue
    while queue:
        value = queue.pop(0)
        print(value, end=" ")
        for n in graph[value]:
            if n not in visited_list:
                visited_list.append(n)
                queue.append(n)
```
```
def dijkstra(graph_sparse, source=0):
    """
    Compute the shortest paths from source to all vertices using Dijkstra
    on a sparse adjacency matrix (CSR).

    Parameters:
        graph_sparse: csr_matrix
            Sparse adjacency matrix with weights (0 means no edge)
        source: int
            Index of the source vertex

    Returns:
        distances: list of shortest distances from source
    """
    num_of_vertices = graph_sparse.shape[0]
    visited = np.zeros(num_of_vertices, dtype=bool)
    distances = np.full(num_of_vertices, sys.maxsize)
    distances[source] = 0

    for _ in range(num_of_vertices):
        # Pick the unvisited vertex with the smallest distance
        unvisited_indices = np.where(~visited)[0]
        if len(unvisited_indices) == 0:
            break
        current = unvisited_indices[np.argmin(distances[unvisited_indices])]
        visited[current] = True

        # Get neighbors (non-zero entries)
        start_ptr = graph_sparse.indptr[current]
        end_ptr = graph_sparse.indptr[current + 1]
        neighbors = graph_sparse.indices[start_ptr:end_ptr]
        weights = graph_sparse.data[start_ptr:end_ptr]

        # Update distances
        for neighbor, weight in zip(neighbors, weights):
            if not visited[neighbor]:
                new_distance = distances[current] + weight
                if new_distance < distances[neighbor]:
                    distances[neighbor] = new_distance

    return distances
```

```
def floyd_warshall_algorithm(graph):
    n = len(graph)
    for k in range(n):
        for i in range(n):
            for j in range(n):
                # Check if there exists shorter path in vertex k
                if graph[i][j] > graph[i][k] + graph[k][j]:
                    graph[i][j] = graph[i][k] + graph[k][j]
    return graph
```