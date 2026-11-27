# Comprehensive Scientific, Graphing & Matrix Calculator

I want to create a **comprehensive calculator application** using a single HTML file with embedded CSS and JavaScript. The application should be fully functional, responsive, and capable of performing a wide range of mathematical calculations.

All HTML, CSS, and JavaScript must be contained within one standalone `.html` file. Do not require a backend server or external frameworks.

## 1. Visual Design and User Interface

The calculator should have a **clean, minimalist interface with a plain white background**.

- Use white as the primary background color.
- Use light blue and its various shades as the main accent colors, especially for calculation buttons.
- Apply different shades of blue to distinguish numerical buttons, mathematical operators, function buttons, and the main calculation button.
- The `=` button should be visually prominent, using a brighter or more saturated blue.
- Use subtle borders, rounded corners, and consistent spacing.
- Keep the interface professional, readable, and suitable for both educational and practical mathematical use.
- Avoid unnecessary decorations, gradients, dark backgrounds, or excessive visual effects.

The application should provide **three main modes**, accessible through clearly labeled tabs or navigation buttons:

1. Normal Calculator
2. Graph Calculator
3. Matrix Calculator

Switching between modes should be seamless and should not require reloading the page.

## 2. Normal Calculator

The Normal Calculator should support basic arithmetic, scientific calculations, algebra, calculus, number theory, combinatorics, and probability.

### Basic Arithmetic
- Addition
- Subtraction
- Multiplication
- Division
- Exponents and powers
- Square roots and higher-order roots
- Logarithms and natural logarithms
- Fractions and fraction simplification
- Parentheses and expression evaluation
- Factorials
- Absolute value

### Algebra and Equations
- Solve linear equations
- Solve quadratic equations
- Solve cubic equations
- Display equation roots, including complex roots when applicable
- Solve linear and quadratic inequalities
- Support interval notation and inequality solutions

### Complex Numbers
- Perform addition, subtraction, multiplication, and division of complex numbers
- Calculate complex conjugates
- Calculate magnitude and argument
- Convert between rectangular and polar forms

### Calculus
- Calculate derivatives
- Calculate definite and indefinite integrals
- Calculate partial derivatives
- Calculate gradients of multivariable functions

### Number Theory
- Greatest Common Divisor (GCD)
- Least Common Multiple (LCM)

### Combinatorics
- Permutations
- Combinations

### Probability and Statistics
- Conditional probability
- Binomial distribution
- Calculate binomial probabilities and related values

The calculator should support proper mathematical notation where practical and provide clear results, error messages, and intermediate explanations when appropriate.

## 3. Graph Calculator

The Graph Calculator should allow users to enter mathematical equations or functions and visualize their graphs on a coordinate plane.

### Graphing Features
- Accept user-defined mathematical functions and equations.
- Draw the corresponding graph accurately.
- Display the Cartesian coordinate plane with clearly labeled axes.
- Support positive and negative values.
- Allow users to zoom in and out.
- Allow users to pan across the coordinate plane.
- Automatically adjust the graph scale when appropriate.
- Support multiple functions on the same graph.
- Use different colors to distinguish plotted functions.
- Display the entered equation alongside its graph.

### Bonus Mathematical Features
- Calculate the distance between two points.
- Calculate the cosine of the angle between two vectors.

The graph should be interactive, smooth, and easy to interpret.

## 4. Matrix Calculator

The Matrix Calculator should support matrices with dimensions ranging from **1×1 up to 5×5**.

Users should be able to select the matrix dimensions and enter values into a structured matrix grid.

### Matrix Operations
- Matrix addition
- Matrix subtraction
- Matrix multiplication
- Matrix division, implemented through multiplication by the inverse when mathematically valid
- Determinant calculation
- Matrix inverse
- Row Echelon Form (REF)
- Reduced Row Echelon Form (RREF)
- Gaussian elimination
- Gauss-Jordan elimination
- LU decomposition
- QR decomposition
- Jacobian matrix calculation
- Eigenvalues
- Eigenvectors
- Solve systems of linear equations

### Matrix Interface
- Provide an intuitive matrix input grid.
- Allow users to choose matrix dimensions.
- Support operations involving two matrices when required.
- Display the resulting matrix in a clean, readable format.
- Show step-by-step row operations for Gaussian and Gauss-Jordan elimination when possible.
- Clearly identify mathematically invalid operations, such as attempting to invert a singular matrix.

## 5. Functional Requirements

- Every button and mathematical operation must work correctly.
- Validate user input before performing calculations.
- Display meaningful error messages for invalid expressions or undefined operations.
- Handle decimal numbers, negative numbers, fractions, and scientific notation.
- Avoid unnecessary rounding errors where possible.
- Format mathematical results clearly.
- Keep the interface responsive on desktop and mobile screens.
- Use modular JavaScript functions internally to organize the mathematical operations, even though the application must remain a single HTML file.

The final result should be a **complete, interactive mathematical calculator**, combining scientific computation, equation solving, graph visualization, and advanced matrix operations in one application.