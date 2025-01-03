// Initialisation de la carte Leaflet sans vue initiale
var map = L.map('map');
var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib = 'Map data © OpenStreetMap contributors';
var osm = new L.TileLayer(osmUrl, { attribution: osmAttrib }).addTo(map);


// Ajouter l'échelle
L.control.scale().addTo(map);

// Gestionnaire de couches
var baseLayers = {
    "OpenStreetMap": osm
};
var overlays = {};

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

// Tableau de couleurs prédéfinies
const colors = [
'rgb(255, 238, 0)',    // jaune
'rgb(255, 0, 0)',  // rouge
'rgb(150, 0, 250)',  // violet
'rgb(255, 136, 0)',  // orange
'rgb(0, 26, 255)',  // bleu
'rgb(255, 105, 180)',// rose
'rgb(77, 34, 3)', // marron
];

let colorIndex = 0; // Index pour parcourir le tableau de couleurs


// Fonction pour charger et ajouter un fichier JSON à la carte
function loadJSON(filePath, layerName) {
    fetch(filePath)
        .then(response => response.json())
        .then(data => {
            var geojsonLayer = L.geoJSON(data, {
                pointToLayer: function (feature, latlng) {
                    return L.marker(latlng, { icon: customIcon });
                },
                style: function (feature) {
                    console.log('Feature type:', feature.geometry.type);
                    console.log('Layer name:', layerName);

                    if (feature.geometry.type === 'MultiPolygon') {
                        return {
                            className: 'jardin', // classe dans CSS
                        };
                    } else if (feature.geometry.type === 'Polygon') {
                        return {
                            className: 'jardin' // classe dans CSS
                        };

                    } else if (feature.geometry.type === 'MultiLineString') {
                    // Attribuer une couleur du tableau de couleurs prédéfinies
                    const rgbColor = colors[colorIndex % colors.length];
                    colorIndex++; // Incrémenter l'index pour la prochaine couleur

                    return {
                        color: rgbColor,
                        weight: 5
                    };
                } else {
                    return { color: 'blue', weight: 2 }; // Style par défaut
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
layer.on('click', function (e) {
var infoContent = document.getElementById('info-content');
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
    </table>
`;


// Zoomer sur l'entité cliquée avec une marge
if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
var bounds = L.geoJSON(feature).getBounds();
map.fitBounds(bounds.pad(1)); // Ajoutez une marge de 10% autour de l'entité
setTimeout(function() {
    // Déplacer la vue de la carte vers le haut
    map.panBy([0, -200]); // Ajustez cette valeur selon vos besoins
}, 300); // Attendre 300ms pour que le zoom initial se termine
}

// Faire défiler la page vers le tableau d'information
document.getElementById('info-panel').scrollIntoView({ behavior: 'smooth' });
});
}
});



           // Ajouter les points à un cluster
           var markers = L.markerClusterGroup();
           markers.addLayer(geojsonLayer);
           map.addLayer(markers);

           overlays[layerName] = markers;
           // Ajouter la couche au gestionnaire de couches
           layerControl.addOverlay(markers, layerName);
           // Ajouter les limites de la couche au tableau
           allLayersBounds.push(geojsonLayer.getBounds());

           // Vérifier si toutes les couches sont chargées
           if (allLayersBounds.length === 3) {
               // Combiner les limites de toutes les couches
               var combinedBounds = L.latLngBounds(allLayersBounds);
               // Ajuster la vue de la carte pour inclure toutes les couches
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
const visibleCategories = {
    jardins: false,
    lignes: false,
    stations: false
};

// Parcourir les couches de la carte
map.eachLayer(layer => {
    if (layer instanceof L.GeoJSON) {
        // Si la couche GeoJSON est visible, afficher "Jardins"
        if (map.getBounds().intersects(layer.getBounds())) {
            visibleCategories.jardins = true;
        }
    }

    // Vérifier les polygones (parcs et jardins)
    else if (layer instanceof L.Polygon) {
        if (map.getBounds().intersects(layer.getBounds())) {
            visibleCategories.jardins = true;
        }
    }

    // Vérifier les lignes (polylines)
    else if (layer instanceof L.Polyline) {
        if (map.getBounds().intersects(layer.getBounds())) {
            visibleCategories.lignes = true;
        }
    }

    // Vérifier les stations (MarkerClusterGroup)
    else if (layer instanceof L.MarkerClusterGroup) {
        if (map.getBounds().intersects(layer.getBounds())) {
            visibleCategories.stations = true;
        }
    }
});

// Mise à jour du contenu de la légende
const legendContainer = document.querySelector('.legend');
legendContainer.innerHTML = '<h4>Légende</h4>'; // Réinitialiser le contenu

// Ajouter les catégories visibles à la légende
if (visibleCategories.jardins) {
    legendContainer.innerHTML += `
        <div>
            <span class="legend-shape jardin"></span> Parcs et jardins
        </div>`;
}

if (visibleCategories.lignes) {
    legendContainer.innerHTML += `
        <div>
<span class="legend-shape" style="display: block; width: 20px; height: 5px; border: solid 5px; border-image: linear-gradient(to right, #FF6347, #FFD700, #00FF00, #1E90FF, #8A2BE2); border-image-slice: 1;"></span>
            Lignes de métro
        </div>`;
}

if (visibleCategories.stations) {
    legendContainer.innerHTML += `
        <div>
            <img src="http://www.clipartbest.com/cliparts/niB/Edk/niBEdkxXT.png" width="20" height="20"> Entrées/sorties stations
        </div>`;
}
}

// Ajouter l'écouteur d'événement pour la mise à jour de la légende
map.on('moveend', updateLegend);

// Appeler une première fois pour initialiser la légende
updateLegend();

