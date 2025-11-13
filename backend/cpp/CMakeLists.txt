cmake_minimum_required(VERSION 3.15)
project(smartdine_cpp_modules)

set(CMAKE_CXX_STANDARD 17)

# Include pybind11
add_subdirectory(pybind11)

# -------------------------------
# Dijkstra Module 
# -------------------------------
file(GLOB DIJKSTRA_SRC
     "graphs/dijkstra.cpp"
     "graphs/binding.cpp")

pybind11_add_module(dijkstra_graph ${DIJKSTRA_SRC})

# -------------------------------
# Trie Module
# -------------------------------
file(GLOB TRIE_SRC
     "trie/menu_item_trie.cpp" 
     "trie/binding.cpp")

pybind11_add_module(menu_item_trie ${TRIE_SRC})