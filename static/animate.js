// JavaScript code for animating multiple cars with UI controls and real-time rerouting

let map = L.map("map").setView([40.75, -73.98], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

let selectedCar = null;
let carMarkers = {};
let carRoutes = {};
let obstacles = [];
let carIcons = {
  Car_A: L.icon({
    iconUrl: "/static/carA.png",
    iconSize: [30, 30],
    iconAnchor: [15, 7],
  }),
  Car_B: L.icon({
    iconUrl: "/static/carB.png",
    iconSize: [30, 30],
    iconAnchor: [15, 7],
  }),
  Car_C: L.icon({
    iconUrl: "/static/carC.png",
    iconSize: [30, 30],
    iconAnchor: [15, 7],
  }),
};

let simulationStarted = false;
let communicationLog = [];

// UI Elements
let controlPanel = document.createElement("div");
controlPanel.innerHTML = `
    <button onclick="selectCar('Car_A')" id="btnCarA">Select Car A</button>
    <button onclick="selectCar('Car_B')" id="btnCarB">Select Car B</button>
    <button onclick="selectCar('Car_C')" id="btnCarC">Select Car C</button>
    <button onclick="resetSelection()">Reset Selection</button>
    <button onclick="startSimulation()">Start Simulation</button>
    <button onclick="enableObstacleMode()">Place Obstacle</button>
    <div id="communicationLog" style="margin-top: 10px; border: 1px solid black; padding: 10px; height: 150px; overflow-y: auto;"><strong>Communication Log:</strong></div>
`;
document.body.appendChild(controlPanel);

let obstacleMode = false;

function enableObstacleMode() {
  alert("Click on the map to place an obstacle.");
  obstacleMode = true;
}

function selectCar(car) {
  selectedCar = car;
  document.getElementById("btnCarA").style.backgroundColor =
    car === "Car_A" ? "lightgreen" : "";
  document.getElementById("btnCarB").style.backgroundColor =
    car === "Car_B" ? "lightgreen" : "";
  document.getElementById("btnCarC").style.backgroundColor =
    car === "Car_C" ? "lightgreen" : "";
  logCommunication(
    `${car} selected. Now click on the map to set start and destination.`
  );
}

map.on("click", function (e) {
  if (obstacleMode) {
    let obstacleMarker = L.circleMarker(e.latlng, {
      color: "black",
      radius: 8,
    }).addTo(map);
    obstacles.push(e.latlng);
    logCommunication(`Obstacle placed at ${e.latlng.lat}, ${e.latlng.lng}`);
    obstacleMode = false;
    return;
  }

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
    body: JSON.stringify({
      start: start,
      destination: destination,
      obstacles: obstacles,
    }),
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
      highlightRoute(carRoutes[car], car);
    });
}

function highlightRoute(route, car) {
  let colors = { Car_A: "red", Car_B: "blue", Car_C: "green" };
  L.polyline(route, { color: colors[car], weight: 4 }).addTo(map);
  logCommunication(`${car}: Initial route set.`);
}

function startSimulation() {
  if (simulationStarted) {
    alert("Simulation already started.");
    return;
  }
  simulationStarted = true;
  Object.keys(carRoutes).forEach((car) => {
    if (carMarkers[car] && carRoutes[car]) {
      animateCar(carMarkers[car].icon, carRoutes[car], car);
    }
  });
  logCommunication("Simulation started.");
}

function animateCar(carMarker, route, car, index = 0) {
  if (index >= route.length) return;
  let currentPos = carMarker.getLatLng();
  let nextPos = route[index];

  if (checkObstacle(nextPos)) {
    logCommunication(`${car}: Obstacle detected! Recalculating route...`);
    fetchRoute(currentPos, carMarkers[car].destination.getLatLng(), car);
    return;
  }

  let step = 0;
  let interval = setInterval(() => {
    if (step >= 1) {
      clearInterval(interval);
      animateCar(carMarker, route, car, index + 1);
    } else {
      let lat = currentPos.lat + step * (nextPos[0] - currentPos.lat);
      let lng = currentPos.lng + step * (nextPos[1] - currentPos.lng);
      carMarker.setLatLng([lat, lng]);
      step += 0.1;
    }
  }, 100);
}

function checkObstacle(position) {
  return obstacles.some((obstacle) => {
    let distance = map.distance(obstacle, position);
    return distance < 20;
  });
}

function logCommunication(message) {
  communicationLog.push(message);
  let logDiv = document.getElementById("communicationLog");
  logDiv.innerHTML += `<p>${message}</p>`;
  logDiv.scrollTop = logDiv.scrollHeight;
}
