import sys
import os

cpp_module_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'cpp', 'build', 'Release'))
if cpp_module_path not in sys.path:
    sys.path.append(cpp_module_path)

try:
    import menu_trie 
    CPP_AVAILABLE = True
except ImportError as e:
    print("Failed to import menu_trie module:", str(e)) 
    print("Using Python fallback for trie functionality")
    menu_trie = None
    CPP_AVAILABLE = False

class PythonMenuItemTrie: 
    def __init__(self):
        self.items = set() 
    
    def insert(self, name):
        self.items.add(name.lower()) 
    
    def search_by_prefix(self, prefix):
        prefix = prefix.lower()
        return [item for item in self.items if item.startswith(prefix)][:10] 

trie = None

def build_trie(item_names): 
    global trie
    if CPP_AVAILABLE and menu_trie is not None: 
        trie = menu_trie.MenuItemTrie() 
        for name in item_names:
            trie.insert(name)
    else:
        trie = PythonMenuItemTrie() 
        for name in item_names:
            trie.insert(name)

def search_menu_item_prefix(prefix): 
    if trie is None:
        return []
    return trie.search_by_prefix(prefix)