// cpp/graphs/dijkstra.h
#ifndef DIJKSTRA_H
#define DIJKSTRA_H

#include <string>
#include <unordered_map>
#include <vector>

namespace smartdine { 

    using Graph = std::unordered_map<std::string, std::vector<std::pair<std::string, double>>>;

    std::vector<std::string> dijkstra(const Graph& graph, const std::string& start, const std::string& end);

}

#endif