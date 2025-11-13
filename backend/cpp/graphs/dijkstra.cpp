
#include "dijkstra.h"
#include <set>
#include <limits>
#include <algorithm>

namespace smartdine { 

std::vector<std::string> dijkstra(const Graph& graph, const std::string& start, const std::string& end) {
    std::unordered_map<std::string, double> distances;
    std::unordered_map<std::string, std::string> previous;
    std::set<std::pair<double, std::string>> pq;

    for (const auto& node : graph) {
        distances[node.first] = std::numeric_limits<double>::infinity();
    }

    distances[start] = 0.0;
    pq.insert({0.0, start});

    while (!pq.empty()) {
        auto [curr_dist, u] = *pq.begin();
        pq.erase(pq.begin());

        if (u == end) break;

        for (const auto& [v, weight] : graph.at(u)) {
            double new_dist = curr_dist + weight;
            if (new_dist < distances[v]) {
                pq.erase({distances[v], v}); // remove old if exists
                distances[v] = new_dist;
                previous[v] = u;
                pq.insert({new_dist, v});
            }
        }
    }

    std::vector<std::string> path;
    std::string curr = end;
    while (previous.find(curr) != previous.end()) {
        path.push_back(curr);
        curr = previous[curr];
    }

    if (curr == start) {
        path.push_back(start);
        std::reverse(path.begin(), path.end());
    } else {
        path.clear();  // No path found
    }

    return path;
}

}