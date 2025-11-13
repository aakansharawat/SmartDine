#include "menu_item_trie.h" 
#include <iostream>
#include <algorithm> 

using namespace std;

string to_lowercase(const string& input) {
    string lowered = input;
    transform(lowered.begin(), lowered.end(), lowered.begin(), ::tolower);
    return lowered;
}

TrieNode::TrieNode() : is_end_of_word(false) {}

TrieNode::~TrieNode() {
    for (auto& pair : children) {
        delete pair.second;
    }
}

MenuItemTrie::MenuItemTrie() { 
    root = new TrieNode();
}

MenuItemTrie::~MenuItemTrie() { 
    delete root;
}

void MenuItemTrie::insert(const string& word) { 
    string lower_word = to_lowercase(word);
    TrieNode* node = root;

    for (char ch : lower_word) {
        if (!node->children.count(ch)) {
            node->children[ch] = new TrieNode();
        }
        node = node->children[ch];
    }

    node->is_end_of_word = true;
    node->original_words.push_back(word); 
}

void MenuItemTrie::collect_all_words(TrieNode* node, vector<string>& results) { 
    if (node->is_end_of_word) {
        for (const string& word : node->original_words) {
            results.push_back(word);
        }
    }

    for (const auto& pair : node->children) {
        collect_all_words(pair.second, results);
    }
}

vector<string> MenuItemTrie::search_by_prefix(const string& prefix) { 
    string lower_prefix = to_lowercase(prefix);
    TrieNode* node = root;

    for (char ch : lower_prefix) {
        if (!node->children.count(ch)) {
            return {};
        }
        node = node->children[ch];
    }

    vector<string> results;
    collect_all_words(node, results);
    return results;
}