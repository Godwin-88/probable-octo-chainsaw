// 01_menus.cypher — Run first in Neo4j Browser
// Creates Menu nodes for each module.

MERGE (m:Menu {name: 'Blotter'})
  SET m.route = '/transact/blotter', m.description = 'Knowledge context for Blotter';

MERGE (m:Menu {name: 'Factor Lab'})
  SET m.route = '/transact/factor', m.description = 'Knowledge context for Factor Lab';

MERGE (m:Menu {name: 'Factors'})
  SET m.route = '/transact/factors', m.description = 'Knowledge context for Factors';

MERGE (m:Menu {name: 'Optimizer'})
  SET m.route = '/transact/optimizer', m.description = 'Knowledge context for Optimizer';

MERGE (m:Menu {name: 'Portfolio'})
  SET m.route = '/transact/portfolio', m.description = 'Knowledge context for Portfolio';

MERGE (m:Menu {name: 'Pricer'})
  SET m.route = '/transact/pricer', m.description = 'Knowledge context for Pricer';

MERGE (m:Menu {name: 'Risk'})
  SET m.route = '/transact/risk', m.description = 'Knowledge context for Risk';

MERGE (m:Menu {name: 'Scenarios'})
  SET m.route = '/transact/scenarios', m.description = 'Knowledge context for Scenarios';

MERGE (m:Menu {name: 'Volatility'})
  SET m.route = '/transact/volatility', m.description = 'Knowledge context for Volatility';

MERGE (m:Menu {name: 'Volatility Lab'})
  SET m.route = '/transact/volatility', m.description = 'Knowledge context for Volatility Lab';
