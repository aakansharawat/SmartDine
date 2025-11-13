
#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include "dijkstra.h"

namespace py = pybind11;

using namespace smartdine; 

PYBIND11_MODULE(dijkstra_graph, m) {
    m.doc() = "Dijkstra C++ module exposed using pybind11";
    m.def("find_shortest_path", &dijkstra,
          "Find the shortest path between two nodes",
          py::arg("graph"), py::arg("start"), py::arg("end"));
}