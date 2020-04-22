
// Constants
const mapLat = 45.5439, 
        mapLong = -73.6547,
        mapInitZoom = 11,
        mapMinZoom = 9,
        mapMaxZoom = 16;

/**
 * Libraries Map
 *  - code adapted from : @see https://www.d3-graph-gallery.com/graph/backgroundmap_leaflet.html
 *  - code adapted from : @see https://www.d3-graph-gallery.com/graph/bubblemap_leaflet_basic.html
 * */ 

LibrariesMap = class LibrariesMap {

    constructor(divId) {

        // Initialize map
        this.libMap = L.map(divId)
                        .setView([mapLat, mapLong], mapInitZoom)

        // Create map's background (from OpenStreetmap)
        L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
            minZoom: mapMinZoom,
            maxZoom: mapMaxZoom,
        }).addTo(this.libMap);

    }
}
