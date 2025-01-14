// Initialisation de la carte Leaflet sans vue initiale
var map = L.map('map');
var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'; // URL de l'API OSM
var osmAttrib = 'Map data © OpenStreetMap contributors'; // Attribution OSM
var osm = new L.TileLayer(osmUrl, { attribution: osmAttrib }).addTo(map);

// Ajouter l'échelle
L.control.scale().addTo(map);

// Gestionnaire de couches
var baseLayers = {
    "OpenStreetMap": osm // Couche OpenStreetMap
};
var overlays = {}; // Tableau pour stocker les couches

// Initialisation du gestionnaire de couches
var layerControl = L.control.layers(baseLayers, overlays).addTo(map);

// Tableau pour stocker les limites de toutes les couches
var allLayersBounds = [];

// Création de l'icône personnalisée
var customIcon = L.icon({
    iconUrl: 'http://www.clipartbest.com/cliparts/niB/Edk/niBEdkxXT.png',
    iconSize: [20, 20], // Taille de l'icône
    iconAnchor: [16, 16], // Point d'ancrage de l'icône
    popupAnchor: [0, -16] // Point d'ancrage du popup
});

// Tableau de couleurs prédéfinies pour les lignes
const colors = [
    'rgb(255, 238, 0)', // jaune
    'rgb(255, 0, 0)', // rouge
    'rgb(150, 0, 250)', // violet
    'rgb(255, 136, 0)', // orange
    'rgb(0, 26, 255)', // bleu
    'rgb(255, 105, 180)', // rose
    'rgb(77, 34, 3)' // marron
];

let colorIndex = 0; // Index pour parcourir le tableau de couleurs

// Fonction pour charger et ajouter un fichier JSON à la carte
function loadJSON(filePath, layerName) {
    fetch(filePath) // Utilisation de fetch pour charger le fichier JSON
        .then(response => response.json()) // Conversion de la réponse en JSON
        .then(data => { // Traitement des données JSON
            var geojsonLayer = L.geoJSON(data, { // Création de la couche GeoJSON
                pointToLayer: function (feature, latlng) { // Personnalisation des points
                    return L.marker(latlng, { icon: customIcon });
                },
                style: function (feature) { // Style des géométries
                    if (feature.geometry.type === 'MultiPolygon' || feature.geometry.type === 'Polygon') {
                        return { className: 'jardin' };
                    } else if (feature.geometry.type === 'MultiLineString') {
                        const rgbColor = colors[colorIndex % colors.length];
                        colorIndex++;
                        return { color: rgbColor, weight: 5 };
                    } else {
                        return { color: 'blue', weight: 2 };
                    }
                },
                onEachFeature: function (feature, layer) {
                    if (feature.geometry.type === 'Point') {
                        var latlng = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
                        var circle = L.circle(latlng, {
                            radius: 300,
                            color: 'red',
                            fillOpacity: 0.1
                        });
                        layer.on('mouseover', function () {
                            circle.addTo(map);
                        });
                        layer.on('mouseout', function () {
                            map.removeLayer(circle);
                        });
                    }

                    // Ajouter un événement de clic pour afficher les informations
                    layer.on('click', function () {
                        var infoContent = document.getElementById('info-content');

                        if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
                            infoContent.innerHTML = `
                                <table>
                                    <tr><th>Nom</th><td>${feature.properties.nom || 'N/A'}</td></tr>
                                    <tr><th>Surface totale (m²)</th><td>${feature.properties.surf_tot_m2 || 'N/A'}</td></tr>
                                    <tr><th>Gestion</th><td>${feature.properties.gestion || 'N/A'}</td></tr>
                                    <tr><th>Accès</th><td>${feature.properties.acces || 'N/A'}</td></tr>
                                    <tr><th>Label</th><td>${feature.properties.label || 'N/A'}</td></tr>
                                    <tr><th>Type d'équipement</th><td>${feature.properties.type_equip || 'N/A'}</td></tr>
                                    <tr><th>Eau</th><td>${feature.properties.eau || 'N/A'}</td></tr>
                                    <tr><th>Toilettes</th><td>${feature.properties.toilettes || 'N/A'}</td></tr>
                                    <tr><th>Chien</th><td>${feature.properties.chien || 'N/A'}</td></tr>
                                    <tr><th>Espace canin</th><td>${feature.properties.esp_can || 'N/A'}</td></tr>
                                </table>`;
                        } else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
                            infoContent.innerHTML = `
                                <table>
                                    <tr><th>Nom de la ligne</th><td>${feature.properties.nom_trace || 'N/A'}</td></tr>
                                    <tr><th>Code de la ligne</th><td>${feature.properties.code_ligne || 'N/A'}</td></tr>
                                    <tr><th>Sens</th><td>${feature.properties.sens || 'N/A'}</td></tr>
                                    <tr><th>Origine</th><td>${feature.properties.nom_origine || 'N/A'}</td></tr>
                                    <tr><th>Destination</th><td>${feature.properties.nom_destination || 'N/A'}</td></tr>
                                    <tr><th>Type de ligne</th><td>${feature.properties.nom_type_ligne || 'N/A'}</td></tr>
                                    <tr><th>Accessibilité PMR</th><td>${feature.properties.pmr ? 'Oui' : 'Non'}</td></tr>
                                    <tr><th>Dernière mise à jour</th><td>${feature.properties.last_update || 'N/A'}</td></tr>
                                </table>`;
                        } else if (feature.geometry.type === 'Point') {
                            infoContent.innerHTML = `
                                <table>
                                    <tr><th>Nom de la station</th><td>${feature.properties.nom || 'N/A'}</td></tr>
                                    <tr><th>Desserte</th><td>${feature.properties.desserte || 'N/A'}</td></tr>
                                    <tr><th>Dernière mise à jour</th><td>${feature.properties.last_update || 'N/A'}</td></tr>
                                </table>`;
                        }

                        if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
                            var bounds = L.geoJSON(feature).getBounds();
                            map.fitBounds(bounds.pad(1));
                            setTimeout(() => {
                                map.panBy([0, -200]);
                            }, 300);
                        }

                        document.getElementById('info-panel').scrollIntoView({ behavior: 'smooth' });
                    });
                }
            });

            var markers = L.markerClusterGroup();
            markers.addLayer(geojsonLayer);
            map.addLayer(markers);

            overlays[layerName] = markers;
            layerControl.addOverlay(markers, layerName);

            allLayersBounds.push(geojsonLayer.getBounds());

            if (allLayersBounds.length === 3) {
                var combinedBounds = L.latLngBounds(allLayersBounds);
                map.fitBounds(combinedBounds);
            }
        })
        .catch(error => console.error('Erreur lors du chargement du fichier JSON:', error));
}

// Charger les fichiers JSON et les ajouter au gestionnaire de couches
loadJSON('data/tclstation.json', 'TCL Stations');
loadJSON('data/sytral_tcl_sytral.json', 'Sytral TCL');
loadJSON('data/lyonparcjardin_latest.json', 'Lyon Parcs et Jardins');

// Fonction pour mettre à jour la légende dynamiquement
function updateLegend() {
    const legendContainer = document.querySelector('.legend');
    legendContainer.innerHTML = '<h4>Légende</h4>';

    for (let layerName in overlays) {
        const layer = overlays[layerName];

        if (map.hasLayer(layer)) {
            if (layerName === 'Lyon Parcs et Jardins') {
                legendContainer.innerHTML += `
                    <div>
                        <span class="legend-shape jardin"></span> Parcs et jardins
                    </div>`;
            } else if (layerName === 'Sytral TCL') {
                legendContainer.innerHTML += `
                    <div>
                        <div class="legend-line metro-line"></div> Lignes de métro
                    </div>`;
            } else if (layerName === 'TCL Stations') {
                legendContainer.innerHTML += `
                    <div>
                        <img src="http://www.clipartbest.com/cliparts/niB/Edk/niBEdkxXT.png" width="20" height="20"> Entrées/sorties stations
                    </div>`;
            }
        }
    }
}

map.on('overlayadd', updateLegend);
map.on('overlayremove', updateLegend);

updateLegend();
