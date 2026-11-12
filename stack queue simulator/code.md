# Stacks and Queues

```
class Stack:
    def __init__(self):
        self.items = []

    def is_empty(self):  # Check if a stack is empty
        return len(self.items) == 0

    def display(self):  # Traverse all nodes
        for i in range(len(self.items)):
            print(self.items[i], "->", end=" ")
        print()

    def push(self, data):  # Append a value to the stack
        self.items.append(data)

    def pop(self):  # Take the top value out of the stack
        if self.is_empty():  # Empty stack
            return None
        else:
            return self.items.pop()

    def get_top(self):  # Get a value at the top of the stack
        if self.is_empty():
            return None
        else:
            return self.items[-1]
```

```
class Queue:
    def __init__(self):  # Initial queue
        self.items = []

    def is_empty(self):  # Check for empty queue
        return self.items == []

    def traverse(self):  # Traverse a queue
        if self.items:
            for item in self.items:
                print(item, end=" ")
            print()  # New line after traversing
        else:
            print("Queue is empty")

    def enqueue(self, item):  # Enqueue an item to the queue
        return self.items.insert(len(self.items), item)

    def dequeue(self):  # Dequeue an item to the queue
        return self.items.pop(0)

    def get_front(self):  # Get the front of the queue
        return self.items[0]

    def get_rear(self):  # Get the rear of the queue
        return self.items[len(self.items) - 1]

    def get_size(self):  # Size of the queue
        return len(self.items)
```

```
class CircularQueue:
    def __init__(self, maximum=100):  # Add maximum length
        self.maximum = maximum
        self.front = -1
        self.rear = -1
        self.items = [None] * maximum

    def is_empty(self):
        return self.front == -1

    def remove(self):
        # Check for empty list
        if self.front == -1:  # Last element in the list
            return False
        # Only one item in the queue
        if self.front == self.rear:
            self.front = -1
            self.rear = -1
        else:
            # Front is the last item in the list (last index)
            if self.front == self.maximum - 1:
                self.front = 0
            else:
                self.front += 1
        return True

    def enqueue(self, data):  # Enqueue the element to the queue
        if (self.front == 0 and self.rear == self.maximum - 1) or (self.front == self.rear + 1):
            print("Queue Overflow")
            return False
        if self.front == -1:
            self.front = 0
            self.rear = 0
        else:
            if self.rear == self.maximum - 1:
                self.rear = 0
            else:
                self.rear += 1
        self.items[self.rear] = data
        return True

    def dequeue(self):  # Dequeue the element to the queue
        if self.front != -1:
            temp = self.items[self.front]
            self.remove()
            return temp
        else:
            print("Queue is empty")
            return False

    def traverse(self):
        front_index = self.front  # Front index
        rear_index = self.rear  # Rear index
        if front_index == -1:  # Front is the last index
            print("Queue is empty")
            return
        if front_index <= rear_index:
            while front_index <= rear_index:
                print(f"{self.items[front_index]} <-", end=" ")
                front_index += 1
        else:
            # From the beginning to last index
            while front_index <= self.maximum - 1:
                print(f"{self.items[front_index]} <-", end=" ")
                front_index += 1
            # Take the remaining item of the queue to the beginning of the list
            front_index = 0  # Back to the beginning of the list
            while front_index <= rear_index:
                print(f"{self.items[front_index]} <-", end=" ")
                front_index += 1
        print()
```

```
class Node:  # Create a node to represent node in doubly linked list
    def __init__(self, data):
        self.data = data
        self.next = None
        self.prev = None


class Deque:
    def __init__(self):
        self.front = None
        self.rear = None
        self.size = 0
        self.datas = []

    def is_empty(self):  # Check for empty queue
        return self.size == 0

    def enqueue_front(self, data):  # Enqueue an element at the front end
        new_node = Node(data)  # Create a new node
        if self.is_empty():  # If the node is empty
            self.front = self.rear = new_node
        else:  # Proceed to the next node as front
            new_node.next = self.front
            self.front.prev = new_node
            self.front = new_node
        self.size += 1  # Increase the size after adding an element

    def enqueue_rear(self, data):  # Enqueue an element at the rear end
        new_node = Node(data)  # Create a new node
        if self.is_empty():  # If the node is empty
            self.front = self.rear = new_node
        else:  # Proceed to the prev node as rear
            new_node.prev = self.rear
            self.rear.next = new_node
            self.rear = new_node
        self.size += 1  # Increase the size after adding an element

    def dequeue_front(self):  # Dequeue at the front end
        if self.is_empty():
            print("Deque is empty")
            return None
        removed_data = self.front.data  # Remove the front data
        if self.front == self.rear:  # Only one element
            self.front = self.rear = None
        else:
            # Proceed to the next front
            self.front = self.front.next
            self.front.prev = None
        self.size -= 1  # Decrease the size after removing an element
        return removed_data

    def dequeue_rear(self):  # Dequeue at the rear end
        if self.is_empty():
            print("Deque is empty")
            return None
        removed_data = self.rear.data  # Remove the rear data
        if self.front == self.rear:  # Only one element
            self.front = self.rear = None
        else:
            # Proceed to the previous rear
            self.rear = self.rear.prev
            self.rear.next = None  # When it is none, the data is removed
        self.size -= 1  # Decrease the size after removing an element
        return removed_data

    def traverse(self):  # Traverse a Deque
        if self.is_empty():
            print("Deque is empty")
            return
        current = self.front
        while current:
            print(current.data, end=" <=> ")
            current = current.next
        print("None")
```