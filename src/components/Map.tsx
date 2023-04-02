import { useEffect, useRef } from "react";
import { Layer, Map, Source } from "react-map-gl";
import { useParams } from "react-router-dom";
import { useRecoilState } from "recoil";
import { selectedBuildingRangeState, selectedBuilding as selectedBuildingState } from "../lib/state";
import axios from "axios";

function MapContainer({
  dataPolygons,
  dataResidence,
  dataBuildings,
}: {
  dataPolygons: any;
  dataResidence: any;
  dataBuildings: any;
}) {
  const mapRef = useRef<any>(null);
  const { layer } = useParams();
  const [selectedBuilding, setSelectedBuilding] = useRecoilState(selectedBuildingState);
  const [selectedBuildingRange, setSelectedBuildingRange] = useRecoilState(selectedBuildingRangeState);

  async function reachableArea(lat: number, lng: number, minutes: number) {
    return (
      await axios({
        url: `https://api.mapbox.com/isochrone/v1/mapbox/walking/${lng}%2C${lat}?contours_minutes=${minutes}&polygons=true&denoise=1&access_token=pk.eyJ1IjoidmRlbWNhayIsImEiOiJja3FwenlrZmowaXcwMm9vMXYzMTN2N3ZsIn0.dcz0zENlRQTwBppZaMAMog&generalize=0`,
        method: "GET",
      })
    ).data;
  }

  async function click(polygonsGeojson: any, lat: number, lng: number) {
    const minuty = [5, 10, 15, 20];

    const state: any = {};

    for (const pocetMinut of minuty) {
      state[pocetMinut] = await reachableArea(lat, lng, pocetMinut);
    }

    setSelectedBuildingRange({
      available: state,
      active: state["5"],
    });
  }

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!layer) {
      map.getSource("polygons").setData(dataPolygons);
      return;
    }

    if (layer.includes("all")) {
      if (layer.includes("kazde")) {
        map.getSource("polygons").setData(dataPolygons);
        return;
      }
      const interval = layer.split("-")[1];
      const filtered = dataPolygons.features.filter(
        (f: any) => f.properties.id.split("-")[f.properties.id.split("-").length - 2] === interval
      );
      map.getSource("polygons").setData({
        type: "FeatureCollection",
        features: filtered,
      });
      return;
    }

    const data = dataPolygons.features.filter((f: any) => f.properties.id === layer);
    map.getSource("polygons").setData(data[0]);
  }, [layer]);

  return (
    <div className='h-full'>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 21.2611,
          latitude: 48.7164,
          zoom: 14,
        }}
        mapStyle='mapbox://styles/mapbox/light-v11'
        mapboxAccessToken='pk.eyJ1IjoidmRlbWNhayIsImEiOiJja3FwenlrZmowaXcwMm9vMXYzMTN2N3ZsIn0.dcz0zENlRQTwBppZaMAMog'
        onLoad={(map) => {
          map.target.on("click", "buildings-3d", async function (e: any) {
            map.target.flyTo({
              center: e.lngLat,
              zoom: 15,
              pitch: 60,
            });

            setSelectedBuilding(e.features[0].properties["@id"]);
            click(dataPolygons, e.lngLat.lat, e.lngLat.lng);
          });
        }}>
        <Source id='polygons' type='geojson' data={selectedBuildingRange.active ?? dataPolygons}>
          <Layer
            id='polygons-roi'
            type='fill'
            paint={{
              "fill-color": "#a8d68b", //088
              "fill-opacity": layer?.includes("kazde") ? 0.01 : 1,
            }}
          />
        </Source>

        <Source id='buildings' type='geojson' data={dataBuildings}>
          <Layer
            id='buildings-3d'
            type='fill-extrusion'
            paint={{
              "fill-extrusion-color": layer?.includes("all")
                ? [
                    "interpolate",
                    ["linear"],
                    [
                      "get",
                      `${layer?.includes("kazde") ? "20" : layer.split("-")[layer.split("-").length - 2]}-minut`,
                      ["get", "scores"],
                    ],
                    0,
                    "#f74d0f",
                    1,
                    "#45a609",
                  ]
                : "#fff", // #24C6DC a #1D4046
              "fill-extrusion-height": ["get", "height"],
              "fill-extrusion-opacity": 0.6,
            }}
          />
        </Source>
      </Map>
    </div>
  );
}
export default MapContainer;
