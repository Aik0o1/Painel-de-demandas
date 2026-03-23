from core.couchdb_client import get_registro_db
import json

def check_data():
    db = get_registro_db()
    ids = [doc_id for doc_id in db if '-' in doc_id]
    if not ids:
        print("No data found")
        return
    
    ids.sort(reverse=True)
    target_id = ids[0]
    doc = db[target_id]
    
    print(f"Checking data for {target_id}")
    print("Keys in doc:", list(doc.keys()))
    
    if 'tempo_analistas' in doc:
        print("\nKeys in tempo_analistas:", list(doc['tempo_analistas'].keys()))
        # Check for something like 'tempo_geral'
        for key in doc['tempo_analistas'].keys():
            if 'tempo' in key.lower():
                print(f"Found potential key: {key}")
                # Print first item to see structure
                if isinstance(doc['tempo_analistas'][key], list) and len(doc['tempo_analistas'][key]) > 0:
                    print(json.dumps(doc['tempo_analistas'][key][0], indent=2))
                else:
                    print(doc['tempo_analistas'][key])

if __name__ == "__main__":
    check_data()
