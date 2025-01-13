// Initialisation de la carte Leaflet sans vue initiale
var map = L.map('map');
var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';  // URL de l'API OSM
var osmAttrib = 'Map data © OpenStreetMap contributors';  // Attribution OSM
var osm = new L.TileLayer(osmUrl, { attribution: osmAttrib }).addTo(map);

// Ajouter l'échelle
L.control.scale().addTo(map);

// Gestionnaire de couches
var baseLayers = {
    "OpenStreetMap": osm  // Couche OpenStreetMap
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
    'rgb(255, 238, 0)',    // jaune
    'rgb(255, 0, 0)',      // rouge
    'rgb(150, 0, 250)',    // violet
    'rgb(255, 136, 0)',    // orange
    'rgb(0, 26, 255)',     // bleu
    'rgb(255, 105, 180)',  // rose
    'rgb(77, 34, 3)',      // marron
];

let colorIndex = 0; // Index pour parcourir le tableau de couleurs


// Fonction pour charger et ajouter un fichier JSON à la carte
function loadJSON(filePath, layerName) { 
    fetch(filePath) // Utilisation de fetch pour charger le fichier JSON
        .then(response => response.json()) // Conversion de la réponse en JSON
        .then(data => {  // Traitement des données JSON
            var geojsonLayer = L.geoJSON(data, {  // Création de la couche GeoJSON
                pointToLayer: function (feature, latlng) {  // pointToLayer pour personnaliser l'icône pour les points
                    return L.marker(latlng, { icon: customIcon });  
                },
                style: function (feature) {  // Style pour les géométries
                    if (feature.geometry.type === 'MultiPolygon') {
                        return { className: 'jardin' }; // Classe CSS pour les jardins
                    } else if (feature.geometry.type === 'Polygon') {
                        return { className: 'jardin' }; // Classe CSS pour les jardins
                    } else if (feature.geometry.type === 'MultiLineString') {
                        const rgbColor = colors[colorIndex % colors.length];
                        colorIndex++; // Incrémenter l'index pour la prochaine couleur
                        return { color: rgbColor, weight: 5 }; // Style pour les lignes
                    } else {
                        return { color: 'blue', weight: 2 }; // Style par défaut
                    }
                },
                onEachFeature: function (feature, layer) { // Ajouter un événement de survol pour afficher le cercle pour les géométries de type Point avec un rayon de 300m et un style
                    if (feature.geometry.type === 'Point') {
                        var latlng = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
                        var circle = L.circle(latlng, {
                            radius: 300,
                            color: 'red',
                            fillOpacity: 0.1
                        });
                        // le mouseover ajoute le cercle
                        layer.on('mouseover', function () {
                            circle.addTo(map);
                        });
                        // le mouseout supprime le cercle 
                        layer.on('mouseout', function () {
                            map.removeLayer(circle);
                        });
                    }


                    
                    // Ajouter un événement de clic pour afficher les informations
layer.on('click', function () {
    var infoContent = document.getElementById('info-content');  

    // Vérifier le type de géométrie et afficher les informations en conséquence
    if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') { //si c'est un polygone ou un ensemble de polygones
        // Informations pour les polygones (parcs/jardins par exemple)
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
        `;  // Afficher les informations dans le tableau HTML
    } else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
        // Informations pour les lignes (par exemple, lignes de métro)
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
            </table>
        `;
    } else if (feature.geometry.type === 'Point') {
        // Informations pour les points (stations)
        infoContent.innerHTML = `
            <table>
                <tr><th>Nom de la station</th><td>${feature.properties.nom || 'N/A'}</td></tr>
                <tr><th>Desserte</th><td>${feature.properties.desserte || 'N/A'}</td></tr>
                <tr><th>Dernière mise à jour</th><td>${feature.properties.last_update || 'N/A'}</td></tr>
            </table>
        `;
    }

    
                        // Zoomer sur l'entité cliquée avec une marge
                        if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
                            var bounds = L.geoJSON(feature).getBounds();
                            map.fitBounds(bounds.pad(1)); // Ajoutez une marge
                            setTimeout(() => {
                                map.panBy([0, -200]); // Ajustez cette valeur selon vos besoins
                            }, 300); // Attendre que le zoom initial se termine
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

            // Ajouter la couche au gestionnaire de couches
            overlays[layerName] = markers;
            layerControl.addOverlay(markers, layerName);  //overlay sert pour afficher la legende

            // Ajouter les limites de la couche au tableau
            allLayersBounds.push(geojsonLayer.getBounds());

            // Vérifier si toutes les couches sont chargées
            if (allLayersBounds.length === 3) { // 3 couches chargées
                var combinedBounds = L.latLngBounds(allLayersBounds);  // Combinaison des limites pour le zoom de début
                map.fitBounds(combinedBounds);
            }
        })
        .catch(error => console.error('Erreur lors du chargement du fichier JSON:', error));  // Gestion des erreurs dans la console si problème 
}

// Charger les fichiers JSON et les ajouter au gestionnaire de couches
loadJSON('data/tclstation.json', 'TCL Stations');
loadJSON('data/sytral_tcl_sytral.json', 'Sytral TCL');
loadJSON('data/lyonparcjardin_latest.json', 'Lyon Parcs et Jardins');

// Fonction pour mettre à jour la légende dynamiquement
function updateLegend() {
    const legendContainer = document.querySelector('.legend');
    legendContainer.innerHTML = '<h4>Légende</h4>'; // Réinitialiser la légende

    // Vérifier les couches visibles et les inclure dans la légende
    for (let layerName in overlays) {
        const layer = overlays[layerName];

        if (map.hasLayer(layer)) {
            if (layerName === 'Lyon Parcs et Jardins') {  // Ajout de la condition pour Lyon Parcs et Jardins
                legendContainer.innerHTML += `
                    <div>
                        <span class="legend-shape jardin"></span> Parcs et jardins
                    </div>`;
            } else if (layerName === 'Sytral TCL') { // Ajout de la condition pour le Sytral TCL
                legendContainer.innerHTML += `
                    <div>
                        <div class="legend-line metro-line"></div> Lignes de métro
                    </div>`;
            } else if (layerName === 'TCL Stations') {  // Ajout de la condition pour TCL Stations
                legendContainer.innerHTML += `
                    <div>
                        <img src="http://www.clipartbest.com/cliparts/niB/Edk/niBEdkxXT.png" width="20" height="20"> Entrées/sorties stations  
                    </div>`;// Ajout de l'URL de l'image pour l'icône
            }
        }
    }
}

// Ajouter les écouteurs d'événements pour la mise à jour de la légende
map.on('overlayadd', updateLegend);   //overlayadd sert lors de l'ajout
map.on('overlayremove', updateLegend);  //overlayremove sert lors de la suppression


// Appeler la fonction au chargement initial
updateLegend();