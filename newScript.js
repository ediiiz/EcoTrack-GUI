
const HOST = "dyhvl375"
const PORT = 3125
const carsOnline = '/carsOnline'
const cars = '/cars'

function Sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

let allCarsData;
let markers = [];
let selectedCarIds = {};
let mainMap = L.map('map').setView([51, 14], 7);

let osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  id: 'ecoTracker-i875mjb7',
  minZoom: 0,
  maxZoom: 15,
  useCache: true,
  crossOrigin: true,
})

let toner = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  id: 'ecoTracker-i875mjb7',
  minZoom: 0,
  maxZoom: 15,
  useCache: true,
  crossOrigin: true,
})

toner.addTo(mainMap);

let baseMaps = {
  "Farbig": osm,
  'Schwarz-Weiss': toner
}

let layerControl = L.control.layers(baseMaps).addTo(mainMap);

let truckIcon = L.icon({
  iconUrl: './icons/truck.png',
  iconSize: [50, 50],
  popupAnchor: [0, 0] // point from which the popup should open relative to the iconAnchor
})

function createUpdateableMarker(map, lat, lng, vehicle) {
  // Create a new marker and add it to the map
  let marker = L.marker([lat, lng], { icon: truckIcon }).addTo(map)
    .bindPopup(vehicle)

  // Define a function for updating the marker's position
  function updateMarkerPosition(lat, lng) {
    const markerPane = document.querySelector('.leaflet-marker-pane');
    const shadowPane = document.querySelector('.leaflet-shadow-pane');
    markerPane.classList.remove("no-transition");
    shadowPane.classList.remove("no-transition");
    console.log('Updating Markers');
    let newPosition = L.latLng(lat, lng);
    marker.setLatLng(newPosition);
  }

  // Return the marker and update function
  return {
    marker: marker,
    updatePosition: updateMarkerPosition
  }
}

// Define a function that takes an array of coordinates
function drawMarkers(data) {

  data = Object.entries(data)
  // Loop through the markers
  for (let i in markers) {
    const marker = markers[i];

    // Flatten the Array to make includes work

    flatData = data.flat();
    // If the marker is not in the data array, remove it from the map and the markers array
    if (!flatData.includes(marker.id)) {
      mainMap.removeLayer(marker.marker);
      markers.splice(i, 1);
    }
  }

  // Loop through the coordinates

  for (const key in data) {
    const id = data[key][0];
    const car = allCarsData.find(c => c.name == id);

    const { longitude, latitude, name } = car ? car : localStorage.removeItem("selectedCars");

    // Check if we already have a marker for this coordinate
    let marker = markers.find(m => m.id == id);

    // If we don't have a marker for this coordinate, create one
    if (!marker) {
      console.log('Creating Markers');
      marker = createUpdateableMarker(mainMap, latitude, longitude, name);
      marker.id = name;
      markers.push(marker);
      console.log(marker);
    }

    // Update the marker's position
    marker.updatePosition(latitude, longitude);

  }
}


function updateCarList() {
  // Check if there are any selected cars in the local storage
  if (localStorage.getItem("selectedCars")) {
    // If there are, get the selected cars from the local storage
    selectedCarIds = JSON.parse(localStorage.getItem("selectedCars"));
  }
  // Loop through allCarsData
  for (const key in allCarsData) {
    const car = allCarsData[key];



    // Check if the car is already in the car list
    let carInList = document.getElementById(car.name);

    // If the car is not in the list, add it
    if (!carInList) {
      // Create a new checkbox element
      let checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = car.name;
      checkbox.id = car.name;


      if (selectedCarIds[car.name]) {
        // If it is, set the checked attribute of the checkbox to true
        checkbox.checked = true;
      }

      // Add an event listener to the checkbox element
      checkbox.addEventListener("change", function (event) {
        event.preventDefault();

        // Get the selected car IDs
        let checkboxes = document.querySelectorAll("#car-list input[type=checkbox]");
        checkboxes.forEach(checkbox => {
          if (checkbox.checked) {
            selectedCarIds[checkbox.value] = true;
            localStorage.setItem("selectedCars", JSON.stringify(selectedCarIds));
          } else {
            delete selectedCarIds[checkbox.value];
            localStorage.setItem("selectedCars", JSON.stringify(selectedCarIds));
          }
        });

        // Call drawMarkers with the selected car IDs
        drawMarkers(selectedCarIds);
      });

      // Create a new label element
      let label = document.createElement("label");
      label.textContent = car.name;
      label.htmlFor = car.name;

      let zoom = document.createElement("span")
      zoom.textContent = '🔎︎'
      zoom.id = car.name
      zoom.className = 'zoomButton'

      zoom.addEventListener('click', function (event) {
        // Get the leaflet-marker-pane element
        const markerPane = document.querySelector('.leaflet-marker-pane');
        const shadowPane = document.querySelector('.leaflet-shadow-pane');
        // Toggle the no-transition class on the leaflet-marker-pane element
        markerPane.classList.add("no-transition");
        shadowPane.classList.add("no-transition");
        // Get the marker object
        let marker = markers.find(m => m.id == zoom.id);

        // Get the LatLng object for the marker
        let latLng = marker.marker.getLatLng();
        marker.marker.openPopup()


        mainMap.setView(latLng, 14)
      })


      // // Add an event listener to the label element to prevent the default behavior of the click event
      // label.addEventListener("click", function (event) {
      //   event.preventDefault();
      // });

      // Create a new div element
      let div = document.createElement("div");
      div.appendChild(checkbox);
      div.appendChild(label);
      div.appendChild(zoom)
      // Add the div element to the car list element
      document.getElementById("car-list").appendChild(div);
    }
  }
}



async function getCars() {
  while (true) {
    const allCarsResponse = await fetch(`http://${HOST}:${PORT}${cars}`)
    allCarsData = await allCarsResponse.json()
    updateCarList();
    console.log('Updated Cars');
    drawMarkers(selectedCarIds)
    console.log("Drawn Markers");
    await Sleep(30000);
  }
}

// Get the sidebar
let sidebar = document.getElementById("sidebar");

// Add a click event listener to the badge
document.getElementById("badge").addEventListener("click", function () {
  // Check if the sidebar has the class "open"
  if (sidebar.classList.contains("open")) {
    // If the sidebar has the class "open", remove it
    sidebar.classList.remove("open");
  } else {
    // If the sidebar doesn't have the class "open", add it
    sidebar.classList.add("open");
  }
});


// Get the badge
let badge = document.getElementById("badge");

// Add a click event listener to the badge
badge.addEventListener("click", function () {
  // Add the "active" class to the badge
  badge.classList.add("active");

  // Set a timeout to remove the "active" class after 500 milliseconds
  setTimeout(function () {
    badge.classList.remove("active");
  }, 2000);
});


// Create a search bar element
let searchBar = document.getElementById("searchbar");

// Add an event listener to the search bar
searchBar.addEventListener("input", function () {
  // Get the search query
  let searchQuery = this.value.toLowerCase();

  // Get all the car elements
  let carElements = document.querySelectorAll("#car-list div");

  displaySelectedCarsCheckbox.checked = false

  // Loop through the car elements
  carElements.forEach(carElement => {
    // Get the car name
    let carName = carElement.textContent.toLowerCase();

    // If the car name does not contain the search query, hide the element
    if (!carName.includes(searchQuery)) {
      carElement.style.display = "none";
    } else {
      carElement.style.display = "grid";
    }
  });
});

let displaySelectedCarsCheckbox = document.getElementById('display-selected-cars-checkbox')
displaySelectedCarsCheckbox.addEventListener("change", function () {
  // Get all car elements in the car-list div
  let carElements = document.querySelectorAll("#car-list div");

  // Loop through the car elements
  for (const carElement of carElements) {
    // Get the checkbox element within the car element
    let checkbox = carElement.querySelector("input[type=checkbox]");

    // If the display selected cars checkbox is checked, only display the car element if the checkbox within it is checked
    if (displaySelectedCarsCheckbox.checked) {
      if (checkbox.checked) {
        carElement.style.display = "grid";
      } else {
        carElement.style.display = "none";
      }
    } else { // If the display selected cars checkbox is not checked, display all car elements
      carElement.style.display = "grid";
    }
  }
});


getCars();
