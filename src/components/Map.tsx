import { Layer, Map, Source } from "react-map-gl";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

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
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!layer) {
      map.getSource("polygons").setData(dataPolygons);
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
          map.target.on("click", "buildings-3d", function (e: any) {
            map.target.flyTo({
              center: e.lngLat,
              zoom: 17,
              pitch: 60,
            });
            console.log(e.features[0].properties);
            setSearchParams({ layer: e.features[0].properties["@id"].split("/").pop() });
          });
        }}>
        <Source id='polygons' type='geojson' data={dataPolygons}>
          <Layer
            id='polygons-roi'
            type='fill'
            paint={{
              "fill-color": "#a8d68b", //088
              "fill-opacity": !layer ? 0.01 : 1,
            }}
          />
        </Source>
        {/* map.addLayer({},firstSymbolId); */}

        {/* <Source id='residence' type='geojson' data={dataResidence}>
          <Layer
            id='residence-points'
            type='circle'
            paint={{
              "circle-opacity": 0.5,
              "circle-stroke-opacity": 0.5,
              "circle-radius": ["interpolate", ["linear"], ["zoom"], 0, 0, 22, 6],
              "circle-color": "#87850b", //1D4046
              "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 0, 0, 22, 4],
              "circle-stroke-color": "#fff",
            }}
          />
        </Source> */}

        <Source id='buildings' type='geojson' data={dataBuildings}>
          <Layer
            id='buildings-3d'
            type='fill-extrusion'
            paint={{
              "fill-extrusion-color": !layer
                ? ["interpolate", ["linear"], ["get", "ranking"], 0, "#f74d0f", 1, "#45a609"]
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
