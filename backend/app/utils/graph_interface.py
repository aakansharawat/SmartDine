import sys
import os
from collections import defaultdict, deque
import heapq

pyd_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "cpp", "build", "Release"))
if pyd_path not in sys.path:
    sys.path.insert(0, pyd_path)

try:
    import dijkstra_graph
    CPP_AVAILABLE = True
except ImportError as e:
    print("Failed to import dijkstra_graph module:", str(e))
    print("Using Python fallback for Dijkstra algorithm")
    dijkstra_graph = None
    CPP_AVAILABLE = False

def python_dijkstra(graph, start, end):
    """
    Python implementation of Dijkstra's shortest path algorithm
    """
    if start not in graph or end not in graph:
        return None
    
    pq = [(0, start, [start])]
    visited = set()
    
    while pq:
        distance, current, path = heapq.heappop(pq)
        
        if current in visited:
            continue
            
        visited.add(current)
        
        if current == end:
            return path
        
        for neighbor, weight in graph.get(current, []):
            if neighbor not in visited:
                new_distance = distance + weight
                new_path = path + [neighbor]
                heapq.heappush(pq, (new_distance, neighbor, new_path))
    
    return None

def find_shortest_path(graph, start, end):
    if CPP_AVAILABLE and dijkstra_graph is not None:
        return dijkstra_graph.find_shortest_path(graph, start, end)
    else:
        return python_dijkstra(graph, start, end)