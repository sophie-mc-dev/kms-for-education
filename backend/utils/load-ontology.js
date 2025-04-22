const $rdf = require('rdflib');
const fs = require('fs');

const store = $rdf.graph(); // Create an RDF store
const fetcher = $rdf.fetcher(store);

// Load the OWL file (assuming it's stored locally)
const owlFile = fs.readFileSync('ontology.owx', 'utf8');
const uri = 'http://example.org/ontology#'; // Base URI

$rdf.parse(owlFile, store, uri, 'application/rdf+xml');

// Now you can query and manipulate the RDF data
