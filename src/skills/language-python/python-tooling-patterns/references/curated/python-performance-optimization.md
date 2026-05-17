# Python Performance Optimization

Curated from a previously merged skill. This file keeps the useful task guidance without preserving the old skill as an active nested skill.

## Guidance

### From `python-performance-optimization-skill.md`

_Source topic: python-performance-optimization_

**Purpose:** Profile and optimize Python code using cProfile, memory profilers, and performance best practices. Use when debugging slow Python code, optimizing bottlenecks, or improving application performance.

# Python Performance Optimization

Comprehensive guide to profiling, analyzing, and optimizing Python code for better performance, including CPU profiling, memory optimization, and implementation best practices.

## When to Use This Skill

- Identifying performance bottlenecks in Python applications
- Reducing application latency and response times
- Optimizing CPU-intensive operations
- Reducing memory consumption and memory leaks
- Improving database query performance
- Optimizing I/O operations
- Speeding up data processing pipelines
- Implementing high-performance algorithms
- Profiling production applications

## Core Concepts

### 1. Profiling Types

- **CPU Profiling**: Identify time-consuming functions
- **Memory Profiling**: Track memory allocation and leaks
- **Line Profiling**: Profile at line-by-line granularity
- **Call Graph**: Visualize function call relationships

### 2. Performance Metrics

- **Execution Time**: How long operations take
- **Memory Usage**: Peak and average memory consumption
- **CPU Utilization**: Processor usage patterns
- **I/O Wait**: Time spent on I/O operations

### 3. Optimization Strategies

- **Algorithmic**: Better algorithms and data structures
- **Implementation**: More efficient code patterns
...

# Better: use timeit for accurate measurements
import timeit

execution_time = timeit.timeit(
    "sum(range(1000000))",
    number=100
)
print(f"Average time: {execution_time/100:.6f} seconds")
```

## Profiling Tools

### Pattern 1: cProfile - CPU Profiling

```python

# Profile the code
if __name__ == "__main__":
    profiler = cProfile.Profile()
    profiler.enable()

    main()

    profiler.disable()

    # Print stats

    # Save to file for later analysis
```

**Command-line profiling:**

```bash

# Profile a script
python -m cProfile -o output.prof script.py

# View results
python -m pstats output.prof

# stats 10
```

### Pattern 2: line_profiler - Line-by-Line Profiling

```python

# Add @profile decorator (line_profiler provides this)
@profile
def process_data(data):

### From `advanced-patterns.md`

_Source topic: advanced-patterns_

# Python Performance Optimization — Advanced Reference

Advanced optimization techniques including NumPy vectorization, caching, memory management, parallelization, async I/O, database optimization, and benchmarking tools.

## Advanced Optimization

### Pattern 11: NumPy for Numerical Operations

```python
import timeit
import numpy as np

def python_sum(n):
    """Sum using pure Python."""
    return sum(range(n))

def numpy_sum(n):
    """Sum using NumPy."""
    return np.arange(n).sum()

n = 1000000

python_time = timeit.timeit(lambda: python_sum(n), number=100)
numpy_time = timeit.timeit(lambda: numpy_sum(n), number=100)

print(f"Python: {python_time:.4f}s")
print(f"NumPy: {numpy_time:.4f}s")
...

# Vectorized operations
def python_multiply():
    """Element-wise multiplication in Python."""
    a = list(range(100000))
    b = list(range(100000))
    return [x * y for x, y in zip(a, b)]

def numpy_multiply():

```

### Pattern 12: Caching with functools.lru_cache

```python

# Cache info
print(f"Cache info: {fibonacci_fast.cache_info()}")
```

### Pattern 13: Using __slots__ for Memory

```python
import sys

# Significant savings with many instances
regular_objects = [RegularClass(i, i+1, i+2) for i in range(10000)]
slotted_objects = [SlottedClass(i, i+1, i+2) for i in range(10000)]

print(f"\nMemory for 10000 regular objects: ~{sys.getsizeof(regular) * 10000} bytes")
print(f"Memory for 10000 slotted objects: ~{sys.getsizeof(slotted) * 10000} bytes")
```

### Pattern 14: Multiprocessing for CPU-Bound Tasks

```python

    """Process tasks sequentially."""

    """Process tasks in parallel."""

```

### Pattern 15: Async I/O for I/O-Bound Tasks

```python

# Async is much faster for I/O-bound work
sync_time, sync_results = synchronous_requests()
async_time, async_results = asyncio.run(asynchronous_requests())

print(f"Synchronous: {sync_time:.2f}s")
print(f"Asynchronous: {async_time:.2f}s")
print(f"Speedup: {sync_time/async_time:.2f}x")
```

## Database Optimization

### Pattern 16: Batch Database Operations

```python
