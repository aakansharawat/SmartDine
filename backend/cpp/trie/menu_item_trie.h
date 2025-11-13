
#ifndef MENU_ITEM_TRIE_H 
#define MENU_ITEM_TRIE_H 

#include <string>
#include <unordered_map>
#include <vector>

using namespace std;

class TrieNode {
public:
    bool is_end_of_word;
    unordered_map<char, TrieNode*> children;
    vector<string> original_words;

    TrieNode();
    ~TrieNode();
};

class MenuItemTrie { 
private:
    TrieNode* root;

    void collect_all_words(TrieNode* node, vector<string>& results); 

public:

    MenuItemTrie(); 

    ~MenuItemTrie(); 
    void insert(const string& word);
    vector<string> search_by_prefix(const string& prefix);
};

#endif