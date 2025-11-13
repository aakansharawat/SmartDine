#include <pybind11/pybind11.h>
#include <pybind11/stl.h>

#include "menu_item_trie.h" 

namespace py = pybind11;


PYBIND11_MODULE(menu_item_trie, m) { 
    py::class_<MenuItemTrie>(m, "MenuItemTrie")
        .def(py::init<>())
  
        .def("insert", &MenuItemTrie::insert) 

        .def("search_by_prefix", &MenuItemTrie::search_by_prefix); 
}