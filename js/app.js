var places = [{
    name: 'Sydney Opera House',
    location: {
        lat: -33.856898,
        lng: 151.215281
    }
}, {
    name: 'Sydney Harbour Bridge',
    location: {
        lat: -33.852306,
        lng: 151.210787
    }
}, {
    name: 'Sydney Tower',
    location: {
        lat: -33.870451,
        lng: 151.20876
    }
}, {
    name: 'Chinese Garden of Friendship',
    location: {
        lat: -33.876557,
        lng: 151.202249
    }
}, {
    name: 'Sydney Observatory',
    location: {
        lat: -33.859141,
        lng: 151.204984
    }
}, {
    name: 'St Mary\'s Cathedral, Sydney',
    location: {
        lat: -33.87119,
        lng: 151.213325
    }
}, {
    name: 'Sea Life Sydney Aquarium',
    location: {
        lat: -33.869585,
        lng: 151.202576
    }
}, {
    name: 'Taronga Zoo',
    location: {
        lat: -33.843022,
        lng: 151.241913
    }
}];

/**
 * @constructor
 * @param {Object} place object
 * @param {Object} map object
 */
var Place = function(data, map) {
    var self = this;
    
    // define place props
    this.map = map;
    this.isActive = ko.observable(false);
    this.name = ko.observable(data.name);
    this.location = ko.observable(data.location);
    
    this.contentStr = '<div class="info">'+
                        '<h3>'+this.name()+'</h3>'+
                        '<div class="info-content">'+
                            '<div id="pano"></div>'+
                            '<div class="details-holder"><div id="details"></div></div>'+
                        '</div>'+
                    '</div>';
    this.pano = null;

    // create marker
    this.marker = new google.maps.Marker({
        map: map,
        position: new google.maps.LatLng(data.location.lat, data.location.lng),
        icon: 'https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png'
    });
    
    // create infoWindow
    this.infoWindow = new google.maps.InfoWindow({
        content: self.contentStr,
        maxWidth: 800
    });
    
    // assing infoWindow props with curent marker & active flag
    this.infoWindow.marker = this.marker;
    this.infoWindow.isActive = this.isActive;

    // listen to marker clicks
    google.maps.event.addListener(self.marker, 'click', function() {
        // show marker
        self.showInfoWindow(map, self.marker);
    });
    
    // listen to infoWindow events
    google.maps.event.addListener(self.infoWindow, 'domready', function() {
        // show panorama when infoWindow visible
        self.showPano();
    });
    google.maps.event.addListener(self.infoWindow, 'closeclick', function() {
        // hide panorama when close infoWindows
        self.closeAllInfoWindows();
    });
};

// track infoWindows
Place.prototype.infoWindows = [];

/**
 * Close all infoWindows
 * @returns undefined
 */
Place.prototype.closeAllInfoWindows = function() {
    /**
        loop all infoWindows
        close infoWindows
        set red pin icon
        set active flag to false
        hide panorama
     */
    for (var i = 0, l = this.infoWindows.length; i < l; i++) {
        this.infoWindows[i].close();
        this.infoWindows[i].marker.setIcon('https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png');
        this.infoWindows[i].isActive(false);
    }
    this.hidePano();
};

/**
 * Show infoWindow
 * @param {Object} google map object
 * @param {Object} google map marker object
 * @returns undefined
 */
Place.prototype.showInfoWindow = function(map, marker) {
    /**
        get place details form wikipedia
        push this infoWindow to infoWindows array
        show this infoWindow and close prev. opened
        set blue pin icon
        flag as active
     */
    this.getDetails();
    this.infoWindows.push(this.infoWindow);
    this.closeAllInfoWindows();
    this.infoWindow.open(map, marker);
    this.marker.setIcon('https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png');
    this.isActive(true);
};

/**
 * Show panorama
 * @returns undefined
 */
Place.prototype.showPano = function() {
    /**
        Hide any prev opened panorama
        Create new one
        Bind to position and marker
        And make it visible
     */
    if (this.pano !== null) {
        this.pano.unbind("position");
        this.pano.setVisible(false);
        this.pano = null;
    }
    this.pano = new google.maps.StreetViewPanorama(document.getElementById("pano"), {
        navigationControl: true,
        enableCloseButton: false,
        addressControl: false,
        linksControl: false
    });
    this.pano.bindTo("position", this.marker);
    this.pano.setVisible(true);
};

/**
 * Hide panorama
 * @returns undefined
 */
Place.prototype.hidePano = function() {
    if (this.pano !== null) {
        this.pano.unbind("position");
        this.pano.setVisible(false);
        this.pano = null;
    }
};

/**
 * Get place details from wikipedia asyncronosly with getJSON and 
 * append them to #details
 * @returns undefined
 */
Place.prototype.getDetails = function() {
    var dataURL = "http://en.wikipedia.org/w/api.php?action=query&prop=extracts|info&format=json&exintro=&inprop=url&iwurl=&rawcontinue=&titles="+ this.name()+"&callback=?";
    $.getJSON(dataURL,function(data, textStatus, jqXHR) {
        $.each(data["query"]["pages"],function(key,value){
            // success
            $('#details')
                .html(value['extract'])
                .after('<a class="wiki-link" href="'
                        + value['fullurl'] +
                        '" target="_blank">More on Wikipedia</a>');
        });
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        // error
        $('#details').html(textStatus + ': failed to load data.');
    });

};

/**
 * @constructor MapViewModel
 */
var MapViewModel = function() {

    var self = this;
    /**
        Define observableArray of places,
        observable search query empty str,
        and observable current place    
     */
    self.placeList = ko.observableArray([]);
    self.query = ko.observable('');
    self.currentPlace = ko.observable();
    
    // initialize map with places
    self.initialize = function() {

        var mapOptions = {
            center: {
                lat: -33.852306,
                lng: 151.210787
            },
            zoom: 13
        };

        var map = new google.maps.Map(document.getElementById('map-canvas'),
            mapOptions);
            
        /**
            loop through the places,
            create place objects from constructor
            and push them to the placeList
         */
            places.forEach(function(place) {
            var place = new Place(place, map);
            self.placeList.push(place);
        });

    };

    // show place info 
    self.showInfo = function(place) {
        self.currentPlace(place);
        place.showInfoWindow(place.map, place.marker);
    };

    // live search places in placeList array 
    self.places = ko.computed(function() {
        var search = self.query().toLowerCase();
        return ko.utils.arrayFilter(self.placeList(), function(place) {
            return place.name().toLowerCase().indexOf(search) >= 0;
        });
    }, this);

};

/**
 * Initialize map
 * @returns undefined
 */
function init() {
    var map = new MapViewModel();
    google.maps.event.addDomListener(window, 'load', map.initialize);
    ko.applyBindings(map);
}

/**
    run init & handle error
 */
$.ajax({
    url: 'https://maps.googleapis.com/maps/api/js?libraries=places&callback=init',
    dataType: 'script',
    success: function () {
        // success
    },
    error: function () {
        $('#log').show().find('.log-message').text('Failed to load google maps. Try to reload app later.');
    }
});
