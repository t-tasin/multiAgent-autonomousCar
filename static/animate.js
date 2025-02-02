// JavaScript code for animating multiple cars with UI controls

let map = L.map("map").setView([40.75, -73.98], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

let selectedCar = null;
let carMarkers = {};
let carRoutes = {};
let carIcons = {
  Car_A: L.icon({
    iconUrl: "/static/carA.png",
    iconSize: [30, 15],
    iconAnchor: [15, 7],
  }),
  Car_B: L.icon({
    iconUrl: "/static/carB.png",
    iconSize: [30, 15],
    iconAnchor: [15, 7],
  }),
};

// Buttons for selecting car
let carSelection = document.createElement("div");
carSelection.innerHTML = `
    <button onclick="selectCar('Car_A')">Select Car A</button>
    <button onclick="selectCar('Car_B')">Select Car B</button>
    <button onclick="resetSelection()">Reset Selection</button>
`;
document.body.appendChild(carSelection);

// Click event handler for selecting a car and setting start/destination
function selectCar(car) {
  selectedCar = car;
  alert(`Selected ${car}. Now click on the map to set start and destination.`);
}

function resetSelection() {
  selectedCar = null;
  alert("Car selection reset. Choose a car again.");
}

map.on("click", function (e) {
  if (!selectedCar) {
    alert("Please select a car first!");
    return;
  }

  if (!carMarkers[selectedCar]) {
    carMarkers[selectedCar] = { start: null, destination: null };
  }

  if (!carMarkers[selectedCar].start) {
    carMarkers[selectedCar].start = L.marker(e.latlng, {
      title: `${selectedCar} Start`,
    }).addTo(map);
    console.log(`${selectedCar} Start Point:`, e.latlng);
  } else if (!carMarkers[selectedCar].destination) {
    carMarkers[selectedCar].destination = L.marker(e.latlng, {
      title: `${selectedCar} Destination`,
    }).addTo(map);
    console.log(`${selectedCar} Destination:`, e.latlng);
    fetchRoute(
      carMarkers[selectedCar].start.getLatLng(),
      carMarkers[selectedCar].destination.getLatLng(),
      selectedCar
    );
  }
});

function fetchRoute(start, destination, car) {
  fetch("/calculate_route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ start: start, destination: destination }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        alert("No route found!");
        return;
      }
      carRoutes[car] = data.route;
      if (!carMarkers[car].icon) {
        carMarkers[car].icon = L.marker(carRoutes[car][0], {
          icon: carIcons[car],
        }).addTo(map);
      }
      animateCar(carMarkers[car].icon, carRoutes[car]);
    });
}

function animateCar(carMarker, route, index = 0) {
  if (index >= route.length) return;
  carMarker.setLatLng(route[index]);
  setTimeout(() => animateCar(carMarker, route, index + 1), 500);
}
