
# Sorting

```
# Bogo Sort (or Permutation Sort)
def permutation(a, left, right):
    result = []  # List to store all the permutations
    if left == right:
        # Append a copy of the list (to avoid reference issues
        result.append(a[:])
    else:
        for i in range(left, right + 1):
            a[left], a[i] = a[i], a[left]  # Swap
            # Recursively collect permutations
            result += permutation(a, left + 1, right)
            a[left], a[i] = a[i], a[left]  # Backtrack (restore the list)
    return result


def is_sorted(arr):
    for i in range(len(arr) - 1):
        if arr[i] > arr[i + 1]:
            return False
    return True


def bogo_sort(arr):  # Time Complexity: Somewhat O(n!) or O(n!^2)
    # The normal algorithm takes the time complexity of O(infinity)
    # Here, we can improve this algorithm by:
    # + Generating all the possible permutations of the sequence
    # + Randomize one of them, and if it is not the resultant sequence
    # + Remove them from the list
    permute_list = permutation(arr, 0, len(arr) - 1)
    while not is_sorted(arr):
        arr = random.choice(permute_list)
        permute_list.remove(arr)
    return arr
```

```
def bubble_sort(a):  # Bubble Sort [Time(n), Space(n) = O(n ^ 2), O(1)]
    n = len(a)
    for i in range(1, n, 1):  # Iterate through array
        is_sorted = True
        # Compare all couple of nearest numbers
        # The lower number is rotated to the left side of the array
        for j in range(0, n - i, 1):
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
                is_sorted = False  # The array is not yet sorted
        if is_sorted:   # If the array is already sorted
            break
    return a
```

```
def cocktail_sort(a):
    n = len(a)
    for i in range(n - 1, 0, -1):
        is_swapped = False
        for j in range(i, 0, -1):  # Visit the sequence from right to left
            if a[j] < a[j - 1]:
                a[j], a[j - 1] = a[j - 1], a[j]
                is_swapped = True
        for j in range(i):  # Visit the sequence from left to right
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
                is_swapped = True
        if not is_swapped:  # If there is no swap in the entire iteration
            return a  # The array is sorted
```

```
def comb_sort(a):  # Comb Sort [Time(n), Space(n) = O(n ^ 2), O(1)]
    n = len(a)
    gap = n
    is_sorted = False
    # If gap == 1 and the array is not sorted
    # The next iteration performs like Bubble Sort
    while (gap != 1) or (not is_sorted):
        gap = int(gap / 1.3)  # Shrink Factor = 1.3
        if gap <= 1:  # If gap is less than 1, treat it as gap = 1
            gap = 1
        # Use Bubble Sort for values that have gap
        is_sorted = True
        for i in range(0, n - gap, 1):
            if a[i] > a[i + gap]:
                a[i], a[i + gap] = a[i + gap], a[i]
                is_sorted = False  # The array is not yet sorted
    return a
```

```
def counting_sort(a):  # [Time(n), Space(n) = O(n + k), O(k)]
    # Create a count array
    max_array = max(a)
    count_array = [0] * max_array
    # Count the occurrence of each element in array
    for i in a:
        # Store them in the count array based on index
        count_array[i - 1] += 1
    # Iteratively compute the elements closest to each other in array
    for j in range(1, len(count_array)):
        count_array[j] += count_array[j - 1]
    # Construct the sort array
    sort_array = [0] * len(a)
    for k in range(len(a) - 1, -1, -1):
        # Shift the computed occurrence
        sort_array[count_array[a[k] - 1] - 1] = a[k]
        count_array[a[k] - 1] -= 1

    return sort_array
```

```
def insertion_sort(a):  # Insertion Sort [Time(n), Space(n) = O(n ^ 2), O(1)]
    n = len(a)
    # left: The left array with the elements sorted
    # right: The right array uses for shifting elements
    # Temp: Store the element of the right array
    for right in range(1, n, 1):  # Start from index 1
        temp = a[right]
        left = right - 1
        while left >= 0 and a[left] > temp:
            # Shift the element to the right to perform replacement
            a[left + 1] = a[left]
            left -= 1
        a[left + 1] = temp  # Right position found
    return a
```

```
def merge(left, right):  # Function to merge the array
    a = []
    n1 = len(left)
    n2 = len(right)
    i, j, k = 0, 0, 0
    while (i < n1) and (j < n2):
        if left[i] < right[j]:
            a.append(left[i])
            i += 1
            k += 1
        elif right[j] < left[i]:
            a.append(right[j])
            j += 1
            k += 1
        else:
            a.append(left[i])
            i += 1
            j += 1
            k += 1
    while i < n1:
        a.append(left[i])
        i += 1
        k += 1
    while j < n2:
        a.append(right[j])
        j += 1
        k += 1
    return a


def merge_sort(a):  # [Time(n), Space(n) = O(n log n), O(n)]
    if len(a) == 1 or len(a) == 0:  # If array has only one value or is empty
        return a
    else:
        low = 0
        high = len(a) - 1
        mid = (low + high) // 2
        left = merge_sort(a[:(mid + 1)])
        right = merge_sort(a[(mid + 1):])
        arr = merge(left, right)
        return arr
```

```
def odd_even_sort(a):  # Time Complexity: O(N^2)
    n = len(a)
    for i in range(n):  # Iterate through array
        is_sorted = True
        for j in range(1, n - 1, 2):  # Compare and swap the odd indexed elements
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
                is_sorted = False  # The array is not yet sorted
        for j in range(0, n - 1, 2):  # Compare and swap the even indexed elements
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
                is_sorted = False  # The array is not yet sorted
        if is_sorted:   # If the array is already sorted
            break
    return a
```

```
def pigeonhole_sort(a):
    n = len(a)
    # Find the size of range by (max - min + 1)
    min_value, max_value = min(a), max(a)
    size = max_value - min_value + 1
    # Create a list of pigeonholes of size
    holes = [0] * size
    # Traverse through the array and put the value
    # into its pigeonhole
    for x in a:
        holes[x - min_value] += 1
    # Put the elements back into the array in order.
    i = 0
    for count in range(size):
        while holes[count] > 0:
            holes[count] -= 1
            a[i] = count + min_value
            i += 1
    return a
```

```
def partition(a):  # Partition algorithm
    low = 0
    high = len(a) - 1
    pivot = a[high]
    i = low - 1  # Indicate the right position of pivot found so far
    for j in range(low, high):
        if a[j] < pivot:  # If the current value at index j is lower than pivot
            i += 1  # The "i" is incremented by 1
            a[i], a[j] = a[j], a[i]  # Swap index i and index j
    a[i + 1], a[high] = a[high], a[i + 1]  # Swap index i + 1 to the pivot
    return i + 1  # Return the correct position of the pivot


def quick_sort(a):  # [Time(n), Space(n) = O(n ^ 2), O(1)]
    low = 0
    high = len(a) - 1
    if low < high:
        pos = partition(a)
        # Divide the array into two parts, excluding the pivot
        # Recursively call the function will trigger partition again
        quick_sort(a[low:pos])
        quick_sort(a[pos+1:high+1])
    return a
```

```
def radix_sort(a):  # [Time(n), Space(n) = O(n * d), O(n * d)]
    max_length = False
    temp, placement = -1, 1
    while not max_length:
        max_length = True
        # Create a bucket to store the numbers from index 0 to index 9
        buckets = [list() for _ in range(10)]  # Multi-dimensional List
        for i in a:
            temp = i // placement  # Take the number as temp
            # Find the digit of the number from last to first
            digit = temp % 10
            # Append the number to the array in the right index (based on digit
            buckets[digit].append(i)
            # If the length is maximum and no more temp
            if max_length and temp > 0:
                max_length = False
        # Initial Index
        v = 0
        for b in range(10):
            # Iterate through the bucket
            bucket = buckets[b]
            for i in bucket:
                a[v] = i  # Take the number in the bucket
                v += 1
        # Proceed to the next digit
        placement *= 10

    return a
```

```
def selection_sort(a):  # Selection Sort [Time(n), Space(n) = O(n ^ 2), O(1)]
    n = len(a)
    for i in range(0, n - 1, 1):
        # Suppose the element at index i is the min value, flag it
        flag = i
        for j in range(i + 1, n, 1):
            # Find the minimum element and flag it
            if a[j] < a[flag]:  # current element < the flag element
                flag = j
        # Rotate the current element with the ith element
        a[i], a[flag] = a[flag], a[i]
    return a
```

```
def shell_sort(a):  # [Time Complexity: O(n^2); Space Complexity: O(1)]
    n = len(a)
    # Rearrange elements at each n/2, n/4, n/8, ..., 1 interval
    interval = n // 2  # Initialize the interval by length // 2
    while interval > 0:
        for i in range(interval, n):
            temp = a[i]
            j = i
            while j >= interval and a[j - interval] > temp:
                # Assign a[j] to a[j - interval]
                a[j] = a[j - interval]
                j -= interval
            a[j] = temp
        interval = interval // 2  # Reduce the interval
    return a
```

```
def sleep_sort(a):  # Time Complexity: Somewhat O(max(array) + n)
    max_value = max(a)  # Take the max value
    n = len(a)
    second = 0
    sorted_array = []
    for i in range(0, max_value + 1):
        # The program sleeps for every 1 second
        second += 1
        print(f"Sleep for {i} seconds")
        time.sleep(1)
        for j in range(n):
            if a[j] == i:  # Find the element in the array
                # with the corresponding number and append it
                sorted_array.append(a[j])
    return sorted_array
```

