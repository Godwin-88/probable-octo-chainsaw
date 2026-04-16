// ============================================================
// 00_knowledge_sources.cypher
// RUN FIRST — before all other cypher files
// Creates KnowledgeSource nodes for every PDF master source.
// All concepts, formulas, strategies, and risks CITE these nodes.
// ============================================================

// ── AlgorithmicTradingStrategies (22 PDFs) ──────────────────

MERGE (ks:KnowledgeSource {id: 'chan_quant_trading'})
SET ks.title = 'Quantitative Trading: How to Build Your Own Algorithmic Trading Business',
    ks.author = 'Ernest P. Chan',
    ks.publisher = 'John Wiley & Sons',
    ks.year = 2009,
    ks.isbn = '978-0-470-28488-4',
    ks.category = 'algorithmic_trading',
    ks.domain = 'quant_finance',
    ks.filename = 'Ernest P Chan - Quantitative trading.pdf',
    ks.folder = 'AlgorithmicTradingStrategies',
    ks.key_topics = 'mean reversion;momentum;Sharpe ratio;backtesting;execution;portfolio construction';

MERGE (ks:KnowledgeSource {id: 'tulchinsky_finding_alphas'})
SET ks.title = 'Finding Alphas: A Quantitative Approach to Building Trading Strategies',
    ks.author = 'Igor Tulchinsky et al.',
    ks.publisher = 'Wiley',
    ks.year = 2020,
    ks.isbn = '978-1-119-57571-1',
    ks.category = 'alpha_research',
    ks.domain = 'quant_finance',
    ks.filename = 'Igor Tulchinsky et al. - Finding Alphas.pdf',
    ks.folder = 'AlgorithmicTradingStrategies',
    ks.key_topics = 'alpha generation;signal construction;WorldQuant;factor alphas;decay;neutralization';

MERGE (ks:KnowledgeSource {id: 'hull_options_futures'})
SET ks.title = 'Options, Futures, and Other Derivatives',
    ks.author = 'John C. Hull',
    ks.publisher = 'Pearson',
    ks.year = 2021,
    ks.isbn = '978-0-13-545218-3',
    ks.category = 'derivatives',
    ks.domain = 'financial_engineering',
    ks.filename = 'Options Futures and Other Derivatives by John C Hull.PDF',
    ks.folder = 'AlgorithmicTradingStrategies',
    ks.key_topics = 'options;futures;swaps;Black-Scholes;Greeks;interest rate derivatives;credit derivatives';

MERGE (ks:KnowledgeSource {id: 'nison_candlestick'})
SET ks.title = 'Japanese Candlestick Charting Techniques',
    ks.author = 'Steve Nison',
    ks.publisher = 'Prentice Hall Press',
    ks.year = 2001,
    ks.isbn = '978-0-7352-0181-7',
    ks.category = 'technical_analysis',
    ks.domain = 'quant_finance',
    ks.filename = 'Steve-Nison-Japanese-Candlestick-Charting-Techniques-Prentice-Hall-Press-2001.pdf',
    ks.folder = 'AlgorithmicTradingStrategies',
    ks.key_topics = 'candlestick patterns;doji;hammer;engulfing;trend reversal;support resistance';

MERGE (ks:KnowledgeSource {id: 'taleb_black_swan'})
SET ks.title = 'The Black Swan: The Impact of the Highly Improbable',
    ks.author = 'Nassim Nicholas Taleb',
    ks.publisher = 'Random House',
    ks.year = 2007,
    ks.isbn = '978-1-4000-6351-2',
    ks.category = 'risk_philosophy',
    ks.domain = 'quant_finance',
    ks.filename = 'Taleb_The-Black-Swan.pdf',
    ks.folder = 'AlgorithmicTradingStrategies',
    ks.key_topics = 'black swan;tail risk;fat tails;unknown unknowns;Extremistan;Mediocristan;epistemic uncertainty';

MERGE (ks:KnowledgeSource {id: 'taleb_fooled_randomness'})
SET ks.title = 'Fooled by Randomness: The Hidden Role of Chance in Life and in the Markets',
    ks.author = 'Nassim Nicholas Taleb',
    ks.publisher = 'Random House',
    ks.year = 2004,
    ks.isbn = '978-0-8129-7521-5',
    ks.category = 'risk_philosophy',
    ks.domain = 'quant_finance',
    ks.filename = '5 Fooled by Randomness - Nassim Taleb.pdf',
    ks.folder = 'AlgorithmicTradingStrategies',
    ks.key_topics = 'survivorship bias;randomness;luck vs skill;Monte Carlo;alternative histories;noise';

MERGE (ks:KnowledgeSource {id: 'taleb_dynamic_hedging'})
SET ks.title = 'Dynamic Hedging: Managing Vanilla and Exotic Options',
    ks.author = 'Nassim Nicholas Taleb',
    ks.publisher = 'John Wiley & Sons',
    ks.year = 1997,
    ks.isbn = '978-0-471-15280-5',
    ks.category = 'derivatives',
    ks.domain = 'financial_engineering',
    ks.filename = 'Dynamic_Hedging-Taleb.pdf',
    ks.folder = 'AlgorithmicTradingStrategies',
    ks.key_topics = 'delta hedging;gamma;vega;exotic options;path dependence;hedging in practice';

MERGE (ks:KnowledgeSource {id: 'taleb_skin_in_game'})
SET ks.title = 'Skin in the Game: Hidden Asymmetries in Daily Life',
    ks.author = 'Nassim Nicholas Taleb',
    ks.publisher = 'Random House',
    ks.year = 2018,
    ks.isbn = '978-0-425-28462-9',
    ks.category = 'risk_philosophy',
    ks.domain = 'quant_finance',
    ks.filename = 'skin-in-the-game-nassim-nicholas-taleb.pdf',
    ks.folder = 'AlgorithmicTradingStrategies',
    ks.key_topics = 'moral hazard;agency problem;asymmetric payoffs;ergodicity;risk transfer';

MERGE (ks:KnowledgeSource {id: 'douglas_trading_zone'})
SET ks.title = 'Trading in the Zone: Master the Market with Confidence, Discipline and a Winning Attitude',
    ks.author = 'Mark Douglas',
    ks.publisher = 'Prentice Hall Press',
    ks.year = 2000,
    ks.isbn = '978-0-7352-0144-2',
    ks.category = 'trading_psychology',
    ks.domain = 'behavioral_finance',
    ks.filename = 'Trading In the Zone Mark Douglas.pdf',
    ks.folder = 'AlgorithmicTradingStrategies',
    ks.key_topics = 'trading psychology;discipline;consistency;risk management mindset;probability thinking';

MERGE (ks:KnowledgeSource {id: 'baxter_financial_calculus'})
SET ks.title = 'Financial Calculus: An Introduction to Derivative Pricing',
    ks.author = 'Martin Baxter, Andrew Rennie',
    ks.publisher = 'Cambridge University Press',
    ks.year = 1996,
    ks.isbn = '978-0-521-55289-1',
    ks.category = 'mathematical_finance',
    ks.domain = 'financial_engineering',
    ks.filename = 'Martin Baxter, Andrew Rennie - Financial Calculus.pdf',
    ks.folder = 'AlgorithmicTradingStrategies',
    ks.key_topics = 'Ito calculus;stochastic differential equations;martingale pricing;Girsanov theorem;risk-neutral measure';

MERGE (ks:KnowledgeSource {id: 'springer_financial_math'})
SET ks.title = 'Financial Mathematics, Derivatives and Structured Products',
    ks.author = 'Raymond H. Chan, Yves ZY. Guo, Spike T. Lee, Xun Li',
    ks.publisher = 'Springer Finance',
    ks.year = 2019,
    ks.isbn = '978-981-15-3849-0',
    ks.category = 'mathematical_finance',
    ks.domain = 'financial_engineering',
    ks.filename = 'Financial Mathematics, Derivatives and Structured Products (Springer Finance).pdf',
    ks.folder = 'AlgorithmicTradingStrategies',
    ks.key_topics = 'structured products;exotic derivatives;fixed income;credit;interest rate models';

MERGE (ks:KnowledgeSource {id: 'icasqf_actuarial'})
SET ks.title = 'Actuarial Sciences and Quantitative Finance: ICASQF2016',
    ks.author = 'Jaime A. Londoño, José Garrido, Monique Jeanblanc (eds.)',
    ks.publisher = 'Springer Proceedings in Mathematics & Statistics 214',
    ks.year = 2017,
    ks.isbn = '978-3-319-59754-0',
    ks.category = 'actuarial_quant',
    ks.domain = 'financial_engineering',
    ks.filename = 'Actuarial Sciences and Quantitative Finance ICASQF2016.pdf',
    ks.folder = 'AlgorithmicTradingStrategies',
    ks.key_topics = 'actuarial science;insurance mathematics;longevity risk;mortality modeling;solvency';

MERGE (ks:KnowledgeSource {id: 'oneil_how_to_stocks'})
SET ks.title = 'How to Make Money in Stocks',
    ks.author = 'William J. O\'Neil',
    ks.publisher = 'McGraw-Hill',
    ks.year = 2009,
    ks.isbn = '978-0-07-163248-9',
    ks.category = 'technical_analysis',
    ks.domain = 'quant_finance',
    ks.filename = 'How+To+Make+Money+In+Stocks+-+William+J.+O\'Neil.pdf',
    ks.folder = 'AlgorithmicTradingStrategies',
    ks.key_topics = 'CANSLIM;growth investing;chart patterns;breakout;volume;earnings momentum';

MERGE (ks:KnowledgeSource {id: 'successful_algo_trading'})
SET ks.title = 'Successful Algorithmic Trading',
    ks.author = 'Michael Halls-Moore',
    ks.publisher = 'QuantStart',
    ks.year = 2015,
    ks.category = 'algorithmic_trading',
    ks.domain = 'quant_finance',
    ks.filename = 'Successful Algorithmic Trading.pdf',
    ks.folder = 'AlgorithmicTradingStrategies',
    ks.key_topics = 'backtesting;execution systems;event-driven;mean reversion;momentum;risk management';

MERGE (ks:KnowledgeSource {id: 'fundamental_technical_integrated'})
SET ks.title = 'Fundamental Analysis and Technical Analysis Integrated System',
    ks.author = 'Unknown',
    ks.category = 'hybrid_analysis',
    ks.domain = 'quant_finance',
    ks.filename = 'Fundamental analysis and technical analysis integrated system.pdf',
    ks.folder = 'AlgorithmicTradingStrategies',
    ks.key_topics = 'fundamental analysis;technical analysis;integrated signals;valuation;price action';

MERGE (ks:KnowledgeSource {id: 'disciplined_trader'})
SET ks.title = 'The Disciplined Trader: Developing Winning Attitudes',
    ks.author = 'Mark Douglas',
    ks.publisher = 'Prentice Hall',
    ks.year = 1990,
    ks.isbn = '978-0-13-215757-8',
    ks.category = 'trading_psychology',
    ks.domain = 'behavioral_finance',
    ks.filename = 'The-Disciplined-Trader-Developing-Winning-Attitudes.pdf',
    ks.folder = 'AlgorithmicTradingStrategies',
    ks.key_topics = 'discipline;emotional control;consistency;risk management psychology;mental frameworks';

MERGE (ks:KnowledgeSource {id: 'valuation_volatility'})
SET ks.title = 'Valuation and Volatility: A Stakeholder\'s Perspective',
    ks.author = 'Unknown',
    ks.category = 'valuation',
    ks.domain = 'financial_engineering',
    ks.filename = 'Valuation and Volatility Stakeholders Perspective.pdf',
    ks.folder = 'AlgorithmicTradingStrategies',
    ks.key_topics = 'valuation;volatility;stakeholder analysis;corporate finance;risk premia';

// ── web3 PDFs (9 sources) ────────────────────────────────────

MERGE (ks:KnowledgeSource {id: 'harvey_defi_future'})
SET ks.title = 'DeFi and the Future of Finance',
    ks.author = 'Campbell R. Harvey, Ashwin Ramachandran, Joey Santoro',
    ks.publisher = 'Wiley',
    ks.year = 2021,
    ks.isbn_hardcover = '9781119836018',
    ks.isbn_epub = '9781119836025',
    ks.category = 'decentralized_finance',
    ks.domain = 'web3_defi',
    ks.filename = 'DeFi and the Future of Finance.pdf',
    ks.folder = 'web3',
    ks.foreword = 'Fred Ehrsam (Paradigm, Coinbase)',
    ks.preface = 'Vitalik Buterin (Ethereum)',
    ks.key_topics = 'DeFi primitives;AMM;lending;flash loans;stablecoins;oracles;governance;smart contracts;tokenization;DEX;DeFi risks;centralized finance problems';

MERGE (ks:KnowledgeSource {id: 'coingecko_how_to_defi_advanced'})
SET ks.title = 'How to DeFi: Advanced',
    ks.author = 'CoinGecko (Lucius Fang, Benjamin Hor, Erina Azmi, Win Win Khor)',
    ks.publisher = 'CoinGecko',
    ks.year = 2021,
    ks.category = 'decentralized_finance',
    ks.domain = 'web3_defi',
    ks.filename = 'How to DeFi_ Advanced.pdf',
    ks.folder = 'web3',
    ks.key_topics = 'yield farming;liquidity mining;AMM mechanics;impermanent loss;DeFi aggregators;Layer 2;cross-chain;governance tokens;veTokenomics';

MERGE (ks:KnowledgeSource {id: 'cryptographic_primitives_blockchain'})
SET ks.title = 'Cryptographic Primitives in Blockchain Technology: A Mathematical Introduction',
    ks.author = 'Andreas Bolfing',
    ks.publisher = 'Oxford University Press',
    ks.year = 2020,
    ks.category = 'cryptography',
    ks.domain = 'blockchain_crypto',
    ks.filename = 'Cryptographic Primitives in Blockchain Technology_ A mathematical introduction.pdf',
    ks.folder = 'web3',
    ks.key_topics = 'hash functions;elliptic curve cryptography;digital signatures;ECDSA;zero-knowledge proofs;Merkle trees;consensus mechanisms';

MERGE (ks:KnowledgeSource {id: 'finance_ai_blockchain'})
SET ks.title = 'Finance with Artificial Intelligence and Blockchain',
    ks.author = 'Unknown',
    ks.category = 'fintech_ai',
    ks.domain = 'web3_defi',
    ks.filename = 'Finance with Artificial Intelligence and Blockchain.pdf',
    ks.folder = 'web3',
    ks.key_topics = 'AI in finance;blockchain finance;algorithmic trading;DeFi AI;robo-advisors;credit scoring;fraud detection';

MERGE (ks:KnowledgeSource {id: 'solorio_smart_contracts'})
SET ks.title = 'Hands-On Smart Contract Development with Solidity and Ethereum',
    ks.author = 'Kevin Solorio, Randall Kanna, David H. Hoover',
    ks.publisher = "O'Reilly Media",
    ks.year = 2020,
    ks.isbn = '978-1-492-04520-3',
    ks.category = 'smart_contracts',
    ks.domain = 'blockchain_dev',
    ks.filename = 'Hands-On Smart Contract Development with Solidity and Ethereum.pdf',
    ks.folder = 'web3',
    ks.key_topics = 'Solidity;EVM;smart contracts;Hardhat;Truffle;testing;deployment;ERC-20;security patterns;gas optimization';

MERGE (ks:KnowledgeSource {id: 'learn_ethereum_2e'})
SET ks.title = 'Learn Ethereum, 2nd Edition',
    ks.author = 'Brian Wu, Zhihong Zou, Dongying Song',
    ks.publisher = 'Packt Publishing',
    ks.year = 2023,
    ks.category = 'blockchain_fundamentals',
    ks.domain = 'blockchain_dev',
    ks.filename = 'Learn Ethereum, 2nd Edition (Z-lib.io).pdf',
    ks.folder = 'web3',
    ks.key_topics = 'Ethereum;EVM;Solidity;accounts;transactions;gas;Layer 2;consensus;PoS;DeFi ecosystem';

MERGE (ks:KnowledgeSource {id: 'antonopoulos_mastering_ethereum'})
SET ks.title = 'Mastering Ethereum: Building Smart Contracts and DApps',
    ks.author = 'Andreas M. Antonopoulos, Gavin Wood',
    ks.publisher = "O'Reilly Media",
    ks.year = 2018,
    ks.isbn = '978-1-491-97194-9',
    ks.category = 'blockchain_fundamentals',
    ks.domain = 'blockchain_dev',
    ks.filename = 'Mastering Ethereum_ Building Smart Contracts.pdf',
    ks.folder = 'web3',
    ks.key_topics = 'Ethereum protocol;EVM;accounts;gas;Solidity;Vyper;smart contracts;DApps;web3.js;ERC standards;oracles;Layer 2';

MERGE (ks:KnowledgeSource {id: 'math_blockchain'})
SET ks.title = 'Some Fundamentals of Mathematics of Blockchain',
    ks.author = 'Unknown',
    ks.category = 'blockchain_mathematics',
    ks.domain = 'blockchain_crypto',
    ks.filename = 'Some Fundamentals of Mathematics of Blockchain (Z-lib.io).pdf',
    ks.folder = 'web3',
    ks.key_topics = 'consensus proofs;cryptographic proofs;Byzantine fault tolerance;hash functions;Merkle proofs;distributed systems mathematics';

MERGE (ks:KnowledgeSource {id: 'math_arbitrage'})
SET ks.title = 'The Mathematics of Arbitrage',
    ks.author = 'Freddy Delbaen, Walter Schachermayer',
    ks.publisher = 'Springer Finance',
    ks.year = 2006,
    ks.isbn = '978-3-540-21992-7',
    ks.category = 'mathematical_finance',
    ks.domain = 'financial_engineering',
    ks.filename = 'The Mathematics of Arbitrage(Z-Lib.io).pdf',
    ks.folder = 'web3',
    ks.key_topics = 'no-arbitrage;fundamental theorem of asset pricing;NFLVR;equivalent martingale measure;semimartingale theory;completeness';

// ── Psychic-Invention Knowledge Base PDFs (M1-M7, 34 sources) ──

// M1: Value at Risk and Classical Portfolio Theory
MERGE (ks:KnowledgeSource {id: 'm1_var_classical'})
SET ks.title = 'Value at Risk (Technical Paper)',
    ks.author = 'Risk Curriculum',
    ks.category = 'risk_management',
    ks.domain = 'quant_finance',
    ks.filename = '2. VAR.pdf',
    ks.folder = 'psychic-invention/knowledge_base/M1Value at Risk and Classical Portfolio Theory',
    ks.key_topics = 'Value at Risk;VaR;historical simulation;parametric VaR;Monte Carlo VaR;backtesting;regulatory capital';

MERGE (ks:KnowledgeSource {id: 'm1_utility_portfolio'})
SET ks.title = 'From Utility Theory to Classical Portfolio Theory',
    ks.author = 'Risk Curriculum',
    ks.category = 'portfolio_theory',
    ks.domain = 'quant_finance',
    ks.filename = '3. FROM UTILITY THEORY TO CLASSICAL PORTFOLIO THEORY.pdf',
    ks.folder = 'psychic-invention/knowledge_base/M1Value at Risk and Classical Portfolio Theory',
    ks.key_topics = 'utility theory;expected utility;Markowitz;mean-variance;efficient frontier;risk aversion';

MERGE (ks:KnowledgeSource {id: 'm1_math_portfolio'})
SET ks.title = 'The Mathematics of Classical Portfolio Theory',
    ks.author = 'Risk Curriculum',
    ks.category = 'portfolio_theory',
    ks.domain = 'quant_finance',
    ks.filename = '4.THE MATHEMATICS OF CLASSICAL PORTFOLIO THEORY.pdf',
    ks.folder = 'psychic-invention/knowledge_base/M1Value at Risk and Classical Portfolio Theory',
    ks.key_topics = 'quadratic programming;covariance matrix;efficient frontier mathematics;GMV portfolio;tangency portfolio';

MERGE (ks:KnowledgeSource {id: 'm1_sample_moments'})
SET ks.title = 'Sample Moments and Portfolio Performance (Parts I & II)',
    ks.author = 'Risk Curriculum',
    ks.category = 'performance_measurement',
    ks.domain = 'quant_finance',
    ks.filename = 'SAMPLE MOMENTS AND PORTFOLIO PERFORMANCE - PART I.pdf',
    ks.folder = 'psychic-invention/knowledge_base/M1Value at Risk and Classical Portfolio Theory',
    ks.key_topics = 'Sharpe ratio;Sortino ratio;Treynor ratio;information ratio;performance attribution;moment estimation';

// M2: Advanced Classical Portfolio Theory
MERGE (ks:KnowledgeSource {id: 'm2_beyond_mvo'})
SET ks.title = 'Beyond Mean-Variance Optimization',
    ks.author = 'Risk Curriculum',
    ks.category = 'advanced_portfolio',
    ks.domain = 'quant_finance',
    ks.filename = 'BEYOND MEAN-VARIANCE OPTIMIZATION.pdf',
    ks.folder = 'psychic-invention/knowledge_base/M2 Elements of Advanced Classical Portfolio Theory',
    ks.key_topics = 'higher moments;skewness optimization;CVaR optimization;robust optimization;scenario optimization';

MERGE (ks:KnowledgeSource {id: 'm2_factor_models'})
SET ks.title = 'Factor Models in Portfolio Theory',
    ks.author = 'Risk Curriculum',
    ks.category = 'factor_investing',
    ks.domain = 'quant_finance',
    ks.filename = 'FACTOR MODELS IN PORTFOLIO THEORY.pdf',
    ks.folder = 'psychic-invention/knowledge_base/M2 Elements of Advanced Classical Portfolio Theory',
    ks.key_topics = 'CAPM;APT;Fama-French;factor betas;systematic risk;idiosyncratic risk;factor covariance';

// M3: Black-Litterman
MERGE (ks:KnowledgeSource {id: 'm3_blm_detail'})
SET ks.title = 'The Black-Litterman Model in Detail',
    ks.author = 'Jay Walters',
    ks.category = 'portfolio_optimization',
    ks.domain = 'quant_finance',
    ks.filename = 'The Black-Litterman Model in Detail.pdf',
    ks.folder = 'psychic-invention/knowledge_base/M3 The Black-Litterman Model and Probabilistic Scenarios Optimization/1. BLM',
    ks.key_topics = 'Black-Litterman;reverse optimization;Bayesian updating;view matrix;tau parameter;implied returns';

MERGE (ks:KnowledgeSource {id: 'm3_blm_uses_misuses'})
SET ks.title = 'Uses and Misuses of the Black-Litterman Model in Portfolio Constraints',
    ks.author = 'Risk Curriculum',
    ks.category = 'portfolio_optimization',
    ks.domain = 'quant_finance',
    ks.filename = 'Uses and Misuses of the Black-Litterman Model in Portfolio Constraints.pdf',
    ks.folder = 'psychic-invention/knowledge_base/M3 The Black-Litterman Model and Probabilistic Scenarios Optimization/3. Abuses of BLM',
    ks.key_topics = 'BLM constraints;long-only;view specification errors;tau calibration;portfolio tilts';

// M4: Behavioral Finance
MERGE (ks:KnowledgeSource {id: 'm4_behavioral_finance'})
SET ks.title = 'Behavioral Finance',
    ks.author = 'Risk Curriculum',
    ks.category = 'behavioral_finance',
    ks.domain = 'quant_finance',
    ks.filename = '1. BEHAVIORAL FINANCE.pdf',
    ks.folder = 'psychic-invention/knowledge_base/M4 Behavioral Finance and Applications to Portfolio Theory',
    ks.key_topics = 'cognitive biases;heuristics;overconfidence;herding;market anomalies;behavioral portfolio theory';

MERGE (ks:KnowledgeSource {id: 'm4_prospect_theory'})
SET ks.title = 'Prospect Theory',
    ks.author = 'Kahneman, Tversky',
    ks.category = 'behavioral_finance',
    ks.domain = 'quant_finance',
    ks.filename = '2. Prospect Theory.pdf',
    ks.folder = 'psychic-invention/knowledge_base/M4 Behavioral Finance and Applications to Portfolio Theory',
    ks.key_topics = 'loss aversion;probability weighting;reference dependence;value function;decision weights;framing';

// M5: Kelly and Risk Parity
MERGE (ks:KnowledgeSource {id: 'm5_kelly_criterion'})
SET ks.title = 'The Kelly Criterion and The Optimal Growth Strategy',
    ks.author = 'Risk Curriculum',
    ks.category = 'portfolio_optimization',
    ks.domain = 'quant_finance',
    ks.filename = 'The Kelly Criterion and The Optimal Growth Strategy.pdf',
    ks.folder = 'psychic-invention/knowledge_base/M5 Kelly and Risk Parity Optimizing for Growth and Risk/1. The Kelly Criterion and The Optimal Growth Strategy',
    ks.key_topics = 'Kelly criterion;log utility;geometric mean maximization;fractional Kelly;ruin probability;optimal growth';

MERGE (ks:KnowledgeSource {id: 'm5_risk_parity'})
SET ks.title = 'Introducing Risk Parity',
    ks.author = 'Risk Curriculum',
    ks.category = 'portfolio_optimization',
    ks.domain = 'quant_finance',
    ks.filename = 'INTRO.pdf',
    ks.folder = 'psychic-invention/knowledge_base/M5 Kelly and Risk Parity Optimizing for Growth and Risk/3. Introducing Risk Parity',
    ks.key_topics = 'risk parity;equal risk contribution;HRP;all-weather portfolio;leverage;correlation stability';

// M6: Factor Investing
MERGE (ks:KnowledgeSource {id: 'm6_factor_anomalies'})
SET ks.title = 'Factor Investing: Profitable Anomalies or Anomalous Profits',
    ks.author = 'Risk Curriculum',
    ks.category = 'factor_investing',
    ks.domain = 'quant_finance',
    ks.filename = '1. FACTOR INVESTING PROFITABLE ANOMALIES OR ANOMALOUS PROFITS.pdf',
    ks.folder = 'psychic-invention/knowledge_base/M6 Advances and Challenges in Factor Investing',
    ks.key_topics = 'value factor;momentum factor;quality factor;low volatility;size premium;factor timing;crowding';

MERGE (ks:KnowledgeSource {id: 'm6_empirical_ml'})
SET ks.title = 'Empirical Asset Pricing via Machine Learning',
    ks.author = 'Gu, Kelly, Xiu',
    ks.category = 'factor_investing',
    ks.domain = 'quant_finance',
    ks.filename = 'Empirical Asset Pricing via ML.pdf',
    ks.folder = 'psychic-invention/knowledge_base/M6 Advances and Challenges in Factor Investing',
    ks.key_topics = 'machine learning;neural networks;factor discovery;return prediction;cross-sectional;LASSO;gradient boosting';

MERGE (ks:KnowledgeSource {id: 'm6_neural_factor'})
SET ks.title = 'Neural Network Based Automatic Factor Construction',
    ks.author = 'Risk Curriculum',
    ks.category = 'factor_investing',
    ks.domain = 'quant_finance',
    ks.filename = 'Neural Network Based Automatic Factor Construction.pdf',
    ks.folder = 'psychic-invention/knowledge_base/M6 Advances and Challenges in Factor Investing',
    ks.key_topics = 'neural networks;automatic factor construction;feature engineering;deep learning;alpha signals';

// M7: Information Theory and Graphs
MERGE (ks:KnowledgeSource {id: 'm7_info_theory_graphs'})
SET ks.title = 'Information Theory and Graphs for Improved Portfolios (Master Thesis)',
    ks.author = 'Bjarne Timm',
    ks.category = 'portfolio_theory',
    ks.domain = 'quant_finance',
    ks.filename = '1108697_Master_Thesis_Bjarne_Timm_133274.pdf',
    ks.folder = 'psychic-invention/knowledge_base/M7 Information Theory and Graphs for Improved Portfolios',
    ks.key_topics = 'information theory;entropy;mutual information;graph-based portfolio;minimum spanning tree;hierarchical risk parity';

// ── Indexes for fast lookup ───────────────────────────────────
CREATE INDEX knowledge_source_id IF NOT EXISTS FOR (ks:KnowledgeSource) ON (ks.id);
CREATE INDEX knowledge_source_domain IF NOT EXISTS FOR (ks:KnowledgeSource) ON (ks.domain);
CREATE INDEX knowledge_source_category IF NOT EXISTS FOR (ks:KnowledgeSource) ON (ks.category);
