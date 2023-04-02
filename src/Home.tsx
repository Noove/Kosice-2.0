import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BeatLoader } from "react-spinners";
import MapContainer from "./components/Map";

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [dataPolygons, setDataPolygons] = useState<any>(null);
  const [dataResidence, setDataResidence] = useState<any>(null);
  const [dataBuildings, setDataBuildings] = useState<any>(null);

  const [selectedInterval, setSelectedInterval] = useState("5");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [searchParams, setSearchParams] = useSearchParams();
  
  const navigate = useNavigate();

  // Fetch polygon data for map
  useEffect(() => {
    async function fetchData() {
      const dataPoly = await axios({
        url: "https://martinusius.sk/kosice-2/polygons.json",
        method: "GET",
        onDownloadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          setLoadingMessage(`Loading polygons... ${Math.round((loaded * 100) / total!)}%`);
        },
      });
      setDataPolygons(dataPoly.data);

      const dataResi = await axios({
        url: "https://martinusius.sk/kosice-2/points-residential.json",
        method: "GET",
        onDownloadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          setLoadingMessage(`Loading residences... ${Math.round((loaded * 100) / total!)}%`);
        },
      });
      setDataResidence(dataResi.data);

      const dataBuildings = await axios({
        url: "https://martinusius.sk/kosice-2/buildings-ranked.json",
        method: "GET",
        onDownloadProgress: (progressEvent) => {
          const { loaded, total } = progressEvent;
          setLoadingMessage(`Loading buildings... ${Math.round((loaded * 100) / total!)}%`);
        },
      });
      setDataBuildings(dataBuildings.data);

      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCategory === "all") {
      navigate(`/`);
      return;
    }
    navigate(`/${selectedCategory}-${selectedInterval}-minut`);
  }, [selectedInterval, selectedCategory]);

  if (loading) {
    return (
      <div className='h-full flex flex-col items-center justify-center'>
        <BeatLoader color='#1D4046' />
        <div className='text-gray-500 text-sm mt-5'>{loadingMessage}</div>
      </div>
    );
  }
  return (
    <>
      <MapContainer dataPolygons={dataPolygons} dataResidence={dataResidence} dataBuildings={dataBuildings} />
      <div className='absolute top-0 left-0 flex w-full bg-gradient-to-b from-[#fff] to-[#ffffff00] px-6 py-3'>
        <img className='h-10' src='/logo.svg' alt='Logo' />

        <div className='flex ml-16'>
          <select
            id='layer-type'
            name='layer-type'
            className='w-min pl-3 py-2 text-base border-gray-300 rounded-md focus:outline-none'
            onChange={(e) => {
              setSelectedCategory(e.target.value);
            }}
            value={selectedCategory}>
            <option value='all'>Všetky data</option>

            {dataPolygons.features
              .filter((feature: any, index: number, self: any) => {
                return self.findIndex((f: any) => f.properties.name === feature.properties.name) === index;
              })
              .map((feature: any, index: number) => {
                return (
                  <option key={index} value={feature.properties.category}>
                    {feature.properties.name}
                  </option>
                );
              })}
          </select>

          {selectedCategory !== "all" && (
            <select
              id='layer-type'
              name='layer-type'
              className='w-full ml-5 pl-3 pr-3 py-2 text-base border-gray-300 rounded-md focus:outline-none'
              onChange={(e) => {
                setSelectedInterval(e.target.value);
              }}
              value={selectedInterval}>
              <option value='5'>5 minút</option>
              <option value='10'>10 minút</option>
              <option value='15'>15 minút</option>
              <option value='20'>20 minút</option>
            </select>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
