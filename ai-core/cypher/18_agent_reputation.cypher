// Phase 2: Agent Reputation Graph (ERC-8004 alignment)

// 1. Constraints and Indexes (Managed in neo4j_schema.py, but repeated here for standalone completeness)
CREATE CONSTRAINT agent_did IF NOT EXISTS FOR (a:Agent) REQUIRE a.did IS UNIQUE;
CREATE CONSTRAINT knowledge_source_id IF NOT EXISTS FOR (k:KnowledgeSource) REQUIRE k.id IS UNIQUE;
CREATE INDEX idx_agent_reputation IF NOT EXISTS FOR (a:Agent) ON (a.reputation_score);
CREATE INDEX idx_knowledge_source_type IF NOT EXISTS FOR (k:KnowledgeSource) ON (k.type);

// 2. Seed Research Papers (as KnowledgeSource with type='research_paper')
MERGE (k1:KnowledgeSource {id: 'arxiv:1706.03762'})
SET k1.title = 'Attention is All You Need', 
    k1.authors = ['Vaswani et al.'], 
    k1.citations = 120000, 
    k1.year = 2017,
    k1.domain = 'Machine Learning',
    k1.type = 'research_paper';

MERGE (k2:KnowledgeSource {id: 'arxiv:1512.03385'})
SET k2.title = 'Deep Residual Learning for Image Recognition', 
    k2.authors = ['He et al.'], 
    k2.citations = 180000, 
    k2.year = 2015,
    k2.domain = 'Machine Learning',
    k2.type = 'research_paper';

MERGE (k3:KnowledgeSource {id: 'quant:2104.00001'})
SET k3.title = 'Hierarchical Risk Parity on Chain', 
    k3.authors = ['Lopez de Prado', 'QuantiNova'], 
    k3.citations = 500, 
    k3.year = 2021,
    k3.domain = 'Quantitative Finance',
    k3.type = 'research_paper';

// 3. Seed Agents
MERGE (a1:Agent {did: 'did:arc:agent_research_specialist'})
SET a1.name = 'Curator Agent', 
    a1.signal_accuracy = 0.92, 
    a1.uptime_ratio = 0.995, 
    a1.citations = 120500,
    a1.role = 'Specialist';

MERGE (a2:Agent {did: 'did:arc:agent_trading_executor'})
SET a2.name = 'Trader Agent', 
    a2.signal_accuracy = 0.88, 
    a2.uptime_ratio = 0.98, 
    a2.citations = 500,
    a2.role = 'Execution';

// 4. Establish Citation Links
MATCH (a:Agent {did: 'did:arc:agent_research_specialist'})
MATCH (k:KnowledgeSource) WHERE k.id IN ['arxiv:1706.03762', 'arxiv:1512.03385']
MERGE (a)-[:CITES]->(k);

MATCH (a:Agent {did: 'did:arc:agent_trading_executor'})
MATCH (k:KnowledgeSource {id: 'quant:2104.00001'})
MERGE (a)-[:CITES]->(k);

// 5. Calculate & Set Reputation Scores (ERC-8004)
// Formula: 40% accuracy + 30% citation weight + 30% uptime
MATCH (a:Agent)
WITH a, log(a.citations + 1) / 12.0 AS citation_weight
SET a.reputation_score = 
    (0.4 * a.signal_accuracy) + 
    (0.3 * citation_weight) + 
    (0.3 * a.uptime_ratio);
