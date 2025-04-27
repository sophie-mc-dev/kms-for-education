const rdf = require('rdflib');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Create an RDF store (graph) to hold the ontology data
const store = rdf.graph();

// Function to load OWL ontology into the store
const loadOntology = (ontologyFilePath) => {
  return new Promise((resolve, reject) => {
    const fileUrl = url.pathToFileURL(ontologyFilePath).toString();

    fs.readFile(ontologyFilePath, 'utf8', (err, data) => {
      if (err) {
        return reject('Error reading the ontology file: ' + err);
      }

      try {
        // Parse the OWL file into the store (RDF/XML format)
        rdf.parse(data, store, fileUrl, 'application/rdf+xml');
        resolve('Ontology loaded successfully!');
      } catch (parseErr) {
        reject('Error parsing the OWL file: ' + parseErr);
      }
    });
  });
};

// Function to query resources by category
const queryResourcesByCategory = (categoryUri) => {
  const sparqlQuery = `
    PREFIX : <http://example.org/ontology#>
    SELECT ?resource WHERE {
      ?resource rdf:type :Resource .
      ?resource :hasCategory <${categoryUri}> .
    }
  `;
  return store.query(sparqlQuery);
};

// Function to search for resources based on a query
const searchResources = (searchQuery) => {
  const sparqlQuery = `
    PREFIX : <http://example.org/ontology#>
    SELECT ?resource WHERE {
      ?resource ?p ?o .
      FILTER(CONTAINS(LCASE(STR(?o)), LCASE("${searchQuery}")))
    }
  `;
  return store.query(sparqlQuery);
};

module.exports = {
  loadOntology,
  queryResourcesByCategory,
  searchResources,
};
