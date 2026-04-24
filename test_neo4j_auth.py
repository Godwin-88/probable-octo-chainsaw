from neo4j import GraphDatabase
import sys

def test_auth(user, password):
    uri = "bolt://localhost:7687"
    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        driver.verify_connectivity()
        print(f"SUCCESS: Connected with {user}:{password}")
        driver.close()
        return True
    except Exception as e:
        print(f"FAILURE: {user}:{password} - {e}")
        return False

if __name__ == "__main__":
    test_auth("neo4j", "pricing-engine-kb")
    test_auth("neo4j", "neo4j")
    test_auth("neo4j", "yield-agent-dev")
