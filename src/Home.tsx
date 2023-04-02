import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BeatLoader } from "react-spinners";
import MapContainer from "./components/Map";
import { useRecoilState, useRecoilValue } from "recoil";
import { selectedBuildingRangeState, selectedBuilding as selectedBuildingState } from "./lib/state";

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [dataPolygons, setDataPolygons] = useState<any>(null);
  const [dataResidence, setDataResidence] = useState<any>(null);
  const [dataBuildings, setDataBuildings] = useState<any>(null);

  const [selectedInterval, setSelectedInterval] = useState("5");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [selectedBuilding, setSelectedBuilding] = useRecoilState(selectedBuildingState);
  const [selectedBuildingRange, setSelectedBuildingRange] = useRecoilState(selectedBuildingRangeState);

  const selectedBuildingData = useMemo(() => {
    if (!selectedBuilding) return null;
    return dataBuildings.features.find((feature: any) => feature.properties["@id"] === selectedBuilding);
  }, [selectedBuilding]);

  const navigate = useNavigate();

  const singular = {
    "Všeobecné detské ambulancie": "Všeobecná detská ambulancia",
    Pošty: "Pošta",
    "Zubné ambulancie": "Zubná ambulancia",
    Restaurácie: "Restaurácia",
    Ihriská: "Ihrisko",
    Supermarkety: "Supermarket",
    "Základné školy": "Základná škola",
    "Psie výbehy": "Psí výbeh",
    Drogérie: "Drogéria",
    "Poštové schránky": "Poštová schránka",
    "Mestská hromadná doprava": "Mestská hromadná doprava",
    "Materské školy": "Materská škola",
    "Fitness centrá": "Fitness centrum",
    Bary: "Bar",
    Krčmy: "Krčma",
    "Rýchle občerstvenie": "Rýchle občerstvenie",
    Lekárne: "Lekáreň",
    Potraviny: "Potraviny",
    Kaviarne: "Kaviareň",
    "Všeobecné ambulancie": "Všeobecná ambulancia",
  };

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
    setSelectedBuilding(null);
    if (selectedCategory === "all") {
      navigate(`/all-${selectedInterval}-minut`);
      return;
    }
    if (selectedInterval === "kazde" && selectedCategory !== "all") {
      setSelectedInterval("5");
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
      {selectedBuilding && (
        <div className='absolute bottom-0 left-10 z-10 bg-white px-5 pt-5 rounded-t-lg'>
          <div className='flex justify-between items-center pb-3'>
            <h1 className='text-2xl font-bold '>Dostupnosti služieb:</h1>
            <select
              id='building-distance'
              name='building-distance'
              className='w-min pl-3 py-2 mx-5 text-base border-gray-300 rounded-md focus:outline-none'
              onChange={(e) => {
                setSelectedBuildingRange({
                  ...selectedBuildingRange,
                  active: selectedBuildingRange.available![e.target.value],
                });
              }}
              value={selectedCategory}>
              <option value='1'>5 minút</option>
              <option value='10'>10 minút</option>
              <option value='15'>15 minút</option>
              <option value='20'>20 minút</option>
            </select>
            <button
              className='bg-gray-200 text-gray-500 rounded-full text-sm px-3 py-1'
              onClick={() => {
                setSelectedBuilding(null);
                setSelectedBuildingRange({
                  available: null,
                  active: null,
                });
              }}>
              Zavrieť
            </button>
          </div>
          <div className='overflow-y-scroll h-60'>
            {selectedBuildingData.properties.ids
              .sort((a: string, b: string) => {
                // Show unreachable first
                if (a.includes("unreachable")) return -1;
                if (b.includes("unreachable")) return 1;

                return Number(b.split("-")[b.split("-").length - 2]) - Number(a.split("-")[a.split("-").length - 2]);
              })
              .map((id: string) => {
                if (id.includes("unreachable")) {
                  return (
                    <div key={id} className='flex items-center pb-5'>
                      <div className={`w-4 h-4 rounded-full indicator-unreachable mr-3`}></div>
                      <div className='text-gray-500'>{`Nedostupné - ${
                        //@ts-ignore
                        singular[
                          dataPolygons.features.find(
                            (feature: any) => feature.properties.id === id.replace("unreachable", "15-minut")
                          ).properties.name
                        ]
                      }`}</div>
                    </div>
                  );
                }
                return (
                  <div key={id} className='flex items-center pb-5'>
                    <div
                      className={`w-4 h-4 rounded-full ${
                        id.split("-")[id.split("-").length - 2] === "5"
                          ? "indicator-5"
                          : id.split("-")[id.split("-").length - 2] === "10"
                          ? "indicator-10"
                          : id.split("-")[id.split("-").length - 2] === "15"
                          ? "indicator-15"
                          : "indicator-20"
                      } mr-3`}></div>
                    <div className='text-gray-500'>
                      {`${id.split("-")[id.split("-").length - 2]} minút - ${
                        dataPolygons.features.find((feature: any) => feature.properties.id === id).properties.name
                      }`}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

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
          <select
            id='layer-type'
            name='layer-type'
            className='w-full ml-5 pl-3 pr-3 py-2 text-base border-gray-300 rounded-md focus:outline-none'
            onChange={(e) => {
              setSelectedInterval(e.target.value);
            }}
            value={selectedInterval}>
            {selectedCategory === "all" && <option value='kazde'>Všetky časy</option>}
            <option value='5'>5 minút</option>
            <option value='10'>10 minút</option>
            <option value='15'>15 minút</option>
            <option value='20'>20 minút</option>
          </select>
        </div>
      </div>
    </>
  );
};

export default Home;
