
const HOST = "dyhvl375"
const PORT = 3125
const carsOnline = '/carsOnline'
const cars = '/cars'

function Sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

let markers = [];
let mainMap = L.map('map').setView([51, 14], 7);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mainMap);

function createUpdateableMarker(map, lat, lng, vehicle) {
  // Create a new marker and add it to the map
  let marker = L.marker([lat, lng]).addTo(map)
    .bindPopup(vehicle);

  // Define a function for updating the marker's position
  function updateMarkerPosition(lat, lng) {
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
  // Loop through the coordinates
  for (const key in data) {
    const { id, longitude, latitude, name } = data[key]
    const coord = [latitude, longitude]

    // Check if we already have a marker for this coordinate
    let marker = markers.find(m => m.id == id);

    // If we don't have a marker for this coordinate, create one
    if (!marker) {
      marker = createUpdateableMarker(mainMap, latitude, longitude, name);
      marker.id = id;
      markers.push(marker);
    }

    // Update the marker's position
    marker.updatePosition(latitude, longitude);
  }
}


async function getCars() {
  while (true) {
    const response = await fetch(`http://${HOST}:${PORT}${carsOnline}`)
    const data = await response.json()
    drawMarkers(data);
    console.log(markers);
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



getCars();
