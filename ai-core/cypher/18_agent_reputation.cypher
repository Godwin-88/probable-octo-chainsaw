// Phase 2: Agent Reputation Graph (ERC-8004 alignment)

// 1. Constraints and Indexes
CREATE CONSTRAINT agent_did IF NOT EXISTS FOR (a:Agent) REQUIRE a.did IS UNIQUE;
CREATE CONSTRAINT research_paper_id IF NOT EXISTS FOR (r:ResearchPaper) REQUIRE r.id IS UNIQUE;
CREATE INDEX idx_agent_reputation IF NOT EXISTS FOR (a:Agent) ON (a.reputation_score);
CREATE INDEX idx_research_paper_citations IF NOT EXISTS FOR (r:ResearchPaper) ON (r.citations);

// 2. Seed Research Papers
MERGE (r1:ResearchPaper {id: 'arxiv:1706.03762'})
SET r1.title = 'Attention is All You Need', 
    r1.authors = ['Vaswani et al.'], 
    r1.citations = 120000, 
    r1.year = 2017,
    r1.domain = 'Machine Learning';

MERGE (r2:ResearchPaper {id: 'arxiv:1512.03385'})
SET r2.title = 'Deep Residual Learning for Image Recognition', 
    r2.authors = ['He et al.'], 
    r2.citations = 180000, 
    r2.year = 2015,
    r2.domain = 'Machine Learning';

MERGE (r3:ResearchPaper {id: 'quant:2104.00001'})
SET r3.title = 'Hierarchical Risk Parity on Chain', 
    r3.authors = ['Lopez de Prado', 'QuantiNova'], 
    r3.citations = 500, 
    r3.year = 2021,
    r3.domain = 'Quantitative Finance';

// 3. Seed Agents
MERGE (a1:Agent {did: 'did:arc:agent_research_specialist'})
SET a1.name = 'Research Agent', 
    a1.signal_accuracy = 0.92, 
    a1.uptime_ratio = 0.995, 
    a1.citations = 120500,
    a1.role = 'Specialist';

MERGE (a2:Agent {did: 'did:arc:agent_trading_executor'})
SET a2.name = 'Trading Agent', 
    a2.signal_accuracy = 0.88, 
    a2.uptime_ratio = 0.98, 
    a2.citations = 500,
    a2.role = 'Execution';

// 4. Establish Citation Links
MATCH (a:Agent {did: 'did:arc:agent_research_specialist'})
MATCH (r:ResearchPaper) WHERE r.id IN ['arxiv:1706.03762', 'arxiv:1512.03385']
MERGE (a)-[:CITES]->(r);

MATCH (a:Agent {did: 'did:arc:agent_trading_executor'})
MATCH (r:ResearchPaper {id: 'quant:2104.00001'})
MERGE (a)-[:CITES]->(r);

// 5. Calculate & Set Reputation Scores (ERC-8004)
// Formula: 40% accuracy + 30% citation weight + 30% uptime
MATCH (a:Agent)
WITH a, log(a.citations + 1) / 12.0 AS citation_weight
SET a.reputation_score = 
    (0.4 * a.signal_accuracy) + 
    (0.3 * citation_weight) + 
    (0.3 * a.uptime_ratio);
