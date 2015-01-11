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

var Place = function(data, map) {
    var self = this;

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
    
    this.infoWindow.marker = this.marker;
    this.infoWindow.isActive = this.isActive;

    // listen to marker clicks
    google.maps.event.addListener(self.marker, 'click', function() {
        self.showInfoWindow(map, self.marker);
    });
    
    // listen to infoWindow events
    google.maps.event.addListener(self.infoWindow, 'domready', function() {
        self.showPano();
    });
    google.maps.event.addListener(self.infoWindow, 'closeclick', function() {
        self.closeAllInfoWindows();
    });
};

// track infoWindows
Place.prototype.infoWindows = [];

// close all infoWindows
Place.prototype.closeAllInfoWindows = function() {
    for (var i = 0, l = this.infoWindows.length; i < l; i++) {
        this.infoWindows[i].close();
        this.infoWindows[i].marker.setIcon('https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png');
        this.infoWindows[i].isActive(false);
    }
    this.hidePano();
};

Place.prototype.showInfoWindow = function(map, marker) {
    this.getDetails();
    this.infoWindows.push(this.infoWindow);
    this.closeAllInfoWindows();
    this.infoWindow.open(map, marker);
    this.marker.setIcon('https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png');
    this.isActive(true);
    $('#loader').show();
};

Place.prototype.showPano = function() {
    if (this.pano !== null) {
        this.pano.unbind("position");
        this.pano.setVisible(false);
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

Place.prototype.hidePano = function() {
    if (this.pano !== null) {
        this.pano.unbind("position");
        this.pano.setVisible(false);
        this.pano = null;
    }
};

Place.prototype.getDetails = function() {
    var dataURL = "http://en.wikipedia.org/w/api.php?action=query&prop=extracts|info&format=json&exintro=&inprop=url&iwurl=&rawcontinue=&titles="+ this.name()+"&callback=?";
    $.getJSON(dataURL,function(data, textStatus, jqXHR) {
        $.each(data["query"]["pages"],function(key,value){
            $('#details')
                .html(value['extract'])
                .after('<a class="wiki-link" href="'
                        + value['fullurl'] +
                        '" target="_blank">More on Wikipedia</a>');
        });
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        $('#details').html(textStatus + ': failed to load data.');
    });

};

var MapViewModel = function() {

    var self = this;

    self.placeList = ko.observableArray([]);
    self.query = ko.observable('');
    self.currentPlace = ko.observable();

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

        // loop through the places, 
        // create place object 
        // and push it to the placeList
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

    // search places array 
    self.places = ko.dependentObservable(function() {
        var search = self.query().toLowerCase();
        return ko.utils.arrayFilter(self.placeList(), function(place) {
            return place.name().toLowerCase().indexOf(search) >= 0;
        });
    }, this);

    // initialize map
    google.maps.event.addDomListener(window, 'load', self.initialize);

};

ko.applyBindings(new MapViewModel());