from flask import Flask, request, jsonify, render_template
import osmnx as ox
import networkx as nx

app = Flask(__name__)

# Load road network (change location to your desired city/area)
#place_name = "Manhattan, New York, USA"
G = ox.graph_from_place(["Manhattan, New York, USA", "Jersey City, New Jersey, USA"], network_type="drive")
G = ox.convert.to_undirected(G)  # Corrected method

@app.route("/")
def home():
    return render_template("index.html")  # Serve frontend

@app.route("/calculate_route", methods=["POST"])
def calculate_route():
    data = request.json
    start = (data["start"]["lat"], data["start"]["lng"])
    destination = (data["destination"]["lat"], data["destination"]["lng"])

    # Find nearest nodes on the graph
    start_node = ox.distance.nearest_nodes(G, start[1], start[0])
    dest_node = ox.distance.nearest_nodes(G, destination[1], destination[0])

    # Compute shortest path
    try:
        route = nx.shortest_path(G, start_node, dest_node, weight="length")
        route_coords = [(G.nodes[node]["y"], G.nodes[node]["x"]) for node in route]  # Convert to (lat, lon)
        return jsonify({"route": route_coords})
    except nx.NetworkXNoPath:
        return jsonify({"error": "No available path"}), 400

if __name__ == "__main__":
    app.run(debug=True)
