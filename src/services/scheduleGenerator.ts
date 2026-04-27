import { BusRoute } from '../types';

const generateTrips = (start: string, end: string, interval: number) => {
    const trips = [];
    let [h, m] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const endTotal = endH * 60 + endM;
    
    while (h * 60 + m <= endTotal) {
        trips.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        m += interval;
        if (m >= 60) {
            h += Math.floor(m / 60);
            m %= 60;
        }
    }
    return trips;
};

export const casabusRoutesBase = [
    {
        id: 'L900',
        trips: generateTrips("06:00", "20:33", 9),
        inboundTrips: generateTrips("06:42", "20:39", 9),
        outbound: {
            name: 'L900: Casa-Port → Rachidia',
            tripTime: 71,
            stops: [
                { name: "Casaport Station", lat: 33.5992, lng: -7.6114 },
                { name: "Postal Parcels", lat: 33.6015, lng: -7.6050 },
                { name: "Comanav", lat: 33.6030, lng: -7.5980 },
                { name: "Nassim Pharmacy", lat: 33.6050, lng: -7.5900 },
                { name: "Bouchra Pharmacy", lat: 33.6070, lng: -7.5820 },
                { name: "Marina Space", lat: 33.6100, lng: -7.5750 },
                { name: "Maroc Stylo", lat: 33.6120, lng: -7.5680 },
                { name: "Astral", lat: 33.6150, lng: -7.5600 },
                { name: "Ain Sebaa – Old Police Station", lat: 33.6180, lng: -7.5500 },
                { name: "Afriquia Oukacha", lat: 33.6210, lng: -7.5400 },
                { name: "Oukacha Industrial Zone", lat: 33.6240, lng: -7.5300 },
                { name: "Logistics Company", lat: 33.6270, lng: -7.5200 },
                { name: "Raha Beach", lat: 33.6300, lng: -7.5100 },
                { name: "Oceanic Pool", lat: 33.6350, lng: -7.5000 },
                { name: "Dalila", lat: 33.6400, lng: -7.4900 },
                { name: "Cafe Brochette", lat: 33.6450, lng: -7.4800 },
                { name: "Autohall", lat: 33.6500, lng: -7.4700 },
                { name: "General Tire", lat: 33.6550, lng: -7.4600 },
                { name: "Robel Woods", lat: 33.6600, lng: -7.4550 },
                { name: "Induver", lat: 33.6650, lng: -7.4500 },
                { name: "Little Zenata", lat: 33.6700, lng: -7.4450 },
                { name: "Greater Zenata", lat: 33.6750, lng: -7.4400 },
                { name: "El Ghazouane School", lat: 33.6800, lng: -7.4350 },
                { name: "Paloma Beach", lat: 33.6850, lng: -7.4300 },
                { name: "Ouled Hmimoun Beach", lat: 33.6900, lng: -7.4250 },
                { name: "Cardboard Factory", lat: 33.6950, lng: -7.4200 },
                { name: "Douar Lachehab", lat: 33.7000, lng: -7.4150 },
                { name: "Civil Protection Mohammedia", lat: 33.7030, lng: -7.4100 },
                { name: "Icoma", lat: 33.7060, lng: -7.4080 },
                { name: "Aswak Assalam", lat: 33.7090, lng: -7.4050 },
                { name: "Gabi", lat: 33.7120, lng: -7.4030 },
                { name: "Wellness Residence", lat: 33.7150, lng: -7.4010 },
                { name: "El Matahine", lat: 33.7170, lng: -7.3990 },
                { name: "Mohammedia Station", lat: 33.7121, lng: -7.4011 },
                { name: "Hay Salama", lat: 33.7080, lng: -7.3950 },
                { name: "Faculty of Letters", lat: 33.7060, lng: -7.3920 },
                { name: "Bradaa", lat: 33.7040, lng: -7.3890 },
                { name: "Arab Maghreb College", lat: 33.7020, lng: -7.3860 },
                { name: "Mohammedia Prayer Ground", lat: 33.7000, lng: -7.3830 },
                { name: "El Horria Residence", lat: 33.6980, lng: -7.3810 },
                { name: "Rachidia", lat: 33.6960, lng: -7.3850 }
            ]
        },
        inbound: {
            name: 'L900: Rachidia → Casa-Port',
            tripTime: 71,
            stops: [
                { name: "Rachidia", lat: 33.6960, lng: -7.3850 },
                { name: "El Horria Residence", lat: 33.6980, lng: -7.3810 },
                { name: "Mohammedia Prayer Ground", lat: 33.7000, lng: -7.3830 },
                { name: "Arab Maghreb College", lat: 33.7020, lng: -7.3860 },
                { name: "Bradaa", lat: 33.7040, lng: -7.3890 },
                { name: "Faculty of Letters", lat: 33.7060, lng: -7.3920 },
                { name: "Hay Salama", lat: 33.7080, lng: -7.3950 },
                { name: "Mohammedia Station", lat: 33.7121, lng: -7.4011 },
                { name: "El Matahine", lat: 33.7170, lng: -7.3990 },
                { name: "Wellness Residence", lat: 33.7150, lng: -7.4010 },
                { name: "Gabi", lat: 33.7120, lng: -7.4030 },
                { name: "Aswak Assalam", lat: 33.7090, lng: -7.4050 },
                { name: "Icoma", lat: 33.7060, lng: -7.4080 },
                { name: "Civil Protection Mohammedia", lat: 33.7030, lng: -7.4100 },
                { name: "Douar Lachehab", lat: 33.7000, lng: -7.4150 },
                { name: "Cardboard Factory", lat: 33.6950, lng: -7.4200 },
                { name: "Ouled Hmimoun Beach", lat: 33.6900, lng: -7.4250 },
                { name: "Paloma Beach", lat: 33.6850, lng: -7.4300 },
                { name: "El Ghazouane School", lat: 33.6800, lng: -7.4350 },
                { name: "Greater Zenata", lat: 33.6750, lng: -7.4400 },
                { name: "Little Zenata", lat: 33.6700, lng: -7.4450 },
                { name: "Induver", lat: 33.6650, lng: -7.4500 },
                { name: "Robel Woods", lat: 33.6600, lng: -7.4550 },
                { name: "General Tire", lat: 33.6550, lng: -7.4600 },
                { name: "Autohall", lat: 33.6500, lng: -7.4700 },
                { name: "Cafe Brochette", lat: 33.6450, lng: -7.4800 },
                { name: "Dalila", lat: 33.6400, lng: -7.4900 },
                { name: "Oceanic Pool", lat: 33.6350, lng: -7.5000 },
                { name: "Raha Beach", lat: 33.6300, lng: -7.5100 },
                { name: "Logistics Company", lat: 33.6270, lng: -7.5200 },
                { name: "Oukacha Industrial Zone", lat: 33.6240, lng: -7.5300 },
                { name: "Afriquia Oukacha", lat: 33.6210, lng: -7.5400 },
                { name: "Ain Sebaa – Old Police Station", lat: 33.6180, lng: -7.5500 },
                { name: "Astral", lat: 33.6150, lng: -7.5600 },
                { name: "Maroc Stylo", lat: 33.6120, lng: -7.5680 },
                { name: "Marina Space", lat: 33.6100, lng: -7.5750 },
                { name: "Bouchra Pharmacy", lat: 33.6070, lng: -7.5820 },
                { name: "Nassim Pharmacy", lat: 33.6050, lng: -7.5900 },
                { name: "Comanav", lat: 33.6030, lng: -7.5980 },
                { name: "Postal Parcels", lat: 33.6015, lng: -7.6050 },
                { name: "Casaport Station", lat: 33.5992, lng: -7.6114 }
            ]
        }
    },
    {
        id: 'L905',
        trips: generateTrips("06:00", "20:01", 25),
        outbound: {
            name: 'L905: Fath 2 → Gare Mohammedia',
            tripTime: 42,
            stops: [
                { name: "Fath 2", lat: 33.6800, lng: -7.3600 },
                { name: "Usine De Briques Rouges", lat: 33.6820, lng: -7.3650 },
                { name: "Société Bls", lat: 33.6840, lng: -7.3700 },
                { name: "Anniama", lat: 33.6860, lng: -7.3750 },
                { name: "Bayti Sakan", lat: 33.6880, lng: -7.3800 },
                { name: "Lotissement Malak", lat: 33.6900, lng: -7.3850 },
                { name: "Caïdat De Louizia", lat: 33.6920, lng: -7.3900 },
                { name: "Résidence Raha", lat: 33.6940, lng: -7.3950 },
                { name: "Pharmacie De Louizia", lat: 33.6960, lng: -7.3980 },
                { name: "Résidence Des Champs De Lys", lat: 33.6980, lng: -7.4020 },
                { name: "Résidence Nafissa", lat: 33.7000, lng: -7.4040 },
                { name: "Groupe Scolaire Jules Ferry", lat: 33.7020, lng: -7.4000 },
                { name: "Les Deux Chats", lat: 33.7040, lng: -7.3960 },
                { name: "Msalla Mohammédia 2", lat: 33.7060, lng: -7.3940 },
                { name: "Msalla Mohammédia", lat: 33.7080, lng: -7.3920 },
                { name: "Collège Du Maghreb Arabe", lat: 33.7100, lng: -7.3900 },
                { name: "11 Janvier - Résistance", lat: 33.7120, lng: -7.3880 },
                { name: "Faculté De Lettres", lat: 33.7100, lng: -7.3940 },
                { name: "Hay Salama", lat: 33.7080, lng: -7.3980 },
                { name: "Hôpital Moulay Abdellah", lat: 33.7100, lng: -7.4020 },
                { name: "Gare De Mohammédia", lat: 33.7121, lng: -7.4011 }
            ]
        },
        inbound: {
            name: 'L905: Gare Mohammedia → Fath 2',
            tripTime: 42,
            stops: [
                { name: "Gare De Mohammédia", lat: 33.7121, lng: -7.4011 },
                { name: "Hôpital Moulay Abdellah", lat: 33.7100, lng: -7.4020 },
                { name: "Hay Salama", lat: 33.7080, lng: -7.3980 },
                { name: "Faculté De Lettres", lat: 33.7100, lng: -7.3940 },
                { name: "11 Janvier - Résistance", lat: 33.7120, lng: -7.3880 },
                { name: "Collège Du Maghreb Arabe", lat: 33.7100, lng: -7.3900 },
                { name: "Msalla Mohammédia", lat: 33.7080, lng: -7.3920 },
                { name: "Msalla Mohammédia 2", lat: 33.7060, lng: -7.3940 },
                { name: "Les Deux Chats", lat: 33.7040, lng: -7.3960 },
                { name: "Groupe Scolaire Jules Ferry", lat: 33.7020, lng: -7.4000 },
                { name: "Résidence Nafissa", lat: 33.7000, lng: -7.4040 },
                { name: "Résidence Des Champs De Lys", lat: 33.6980, lng: -7.4020 },
                { name: "Pharmacie De Louizia", lat: 33.6960, lng: -7.3980 },
                { name: "Résidence Raha", lat: 33.6940, lng: -7.3950 },
                { name: "Caïdat De Louizia", lat: 33.6920, lng: -7.3900 },
                { name: "Lotissement Malak", lat: 33.6900, lng: -7.3850 },
                { name: "Bayti Sakan", lat: 33.6880, lng: -7.3800 },
                { name: "Anniama", lat: 33.6860, lng: -7.3750 },
                { name: "Société Bls", lat: 33.6840, lng: -7.3700 },
                { name: "Usine De Briques Rouges", lat: 33.6820, lng: -7.3650 },
                { name: "Fath 2", lat: 33.6800, lng: -7.3600 }
            ]
        }
    },
    {
        id: 'L906',
        trips: generateTrips("06:10", "20:10", 30),
        outbound: {
            name: 'L906: Nahda → Port Mohammedia',
            tripTime: 40,
            stops: [
                { name: "Nahda", lat: 33.6821, lng: -7.3695 },
                { name: "Riad Salam", lat: 33.6852, lng: -7.3712 },
                { name: "Mosquée Riad Salam", lat: 33.6865, lng: -7.3734 },
                { name: "Salam", lat: 33.6881, lng: -7.3756 },
                { name: "Groupe Scolaire Rodin", lat: 33.6902, lng: -7.3789 },
                { name: "Msalla Mohammédia 2", lat: 33.6923, lng: -7.3811 },
                { name: "Résidence El Horria", lat: 33.6945, lng: -7.3833 },
                { name: "Rachidia", lat: 33.6967, lng: -7.3855 },
                { name: "Centre De Santé Riad", lat: 33.6989, lng: -7.3877 },
                { name: "Collège Yacoub El Mansour", lat: 33.7011, lng: -7.3899 },
                { name: "Lydec Alia", lat: 33.7033, lng: -7.3921 },
                { name: "Société Seita", lat: 33.7055, lng: -7.3943 },
                { name: "Pharmacie El Fath", lat: 33.7077, lng: -7.3965 },
                { name: "Mosquée Du Mali", lat: 33.7099, lng: -7.3987 },
                { name: "Gare Routière De Mohammédia", lat: 33.7121, lng: -7.4011 },
                { name: "El Matahine", lat: 33.7143, lng: -7.3995 },
                { name: "Clinique De Fédala", lat: 33.7165, lng: -7.3972 },
                { name: "Pharmacie De L'Avenue", lat: 33.7187, lng: -7.3951 },
                { name: "District Provincial", lat: 33.7209, lng: -7.3934 },
                { name: "Parc De Mohammédia", lat: 33.7231, lng: -7.3912 },
                { name: "Port", lat: 33.7255, lng: -7.3891 }
            ]
        },
        inbound: {
            name: 'L906: Port → Nahda',
            tripTime: 40,
            stops: [
                { name: "Port", lat: 33.7255, lng: -7.3891 },
                { name: "Parc De Mohammédia", lat: 33.7231, lng: -7.3912 },
                { name: "District Provincial", lat: 33.7209, lng: -7.3934 },
                { name: "Pharmacie De L'Avenue", lat: 33.7187, lng: -7.3951 },
                { name: "Clinique De Fédala", lat: 33.7165, lng: -7.3972 },
                { name: "El Matahine", lat: 33.7143, lng: -7.3995 },
                { name: "Gare Routière De Mohammédia", lat: 33.7121, lng: -7.4011 },
                { name: "Mosquée Du Mali", lat: 33.7099, lng: -7.3987 },
                { name: "Pharmacie El Fath", lat: 33.7077, lng: -7.3965 },
                { name: "Société Seita", lat: 33.7055, lng: -7.3943 },
                { name: "Lydec Alia", lat: 33.7033, lng: -7.3921 },
                { name: "Collège Yacoub El Mansour", lat: 33.7011, lng: -7.3899 },
                { name: "Centre De Santé Riad", lat: 33.6989, lng: -7.3877 },
                { name: "Rachidia", lat: 33.6967, lng: -7.3855 },
                { name: "Résidence El Horria", lat: 33.6945, lng: -7.3833 },
                { name: "Msalla Mohammédia 2", lat: 33.6923, lng: -7.3811 },
                { name: "Groupe Scolaire Rodin", lat: 33.6902, lng: -7.3789 },
                { name: "Salam", lat: 33.6881, lng: -7.3756 },
                { name: "Mosquée Riad Salam", lat: 33.6865, lng: -7.3734 },
                { name: "Riad Salam", lat: 33.6852, lng: -7.3712 },
                { name: "Nahda", lat: 33.6821, lng: -7.3695 }
            ]
        }
    },
    {
        id: 'L907',
        trips: generateTrips("06:30", "20:30", 45),
        outbound: {
            name: 'L907: Marjane → Rachidia',
            tripTime: 58,
            stops: [
                { name: "Centre Commercial Marjane", lat: 33.6955, lng: -7.4201 },
                { name: "Faculté De Sciences De Mohammédia", lat: 33.6980, lng: -7.4180 },
                { name: "Institut Supérieur De Technologie Appliquée (ISTA)", lat: 33.7000, lng: -7.4150 },
                { name: "Lycée Technique", lat: 33.7020, lng: -7.4120 },
                { name: "Faculté De Lettres", lat: 33.7060, lng: -7.3920 },
                { name: "Hay Salama", lat: 33.7080, lng: -7.3950 },
                { name: "Hôpital Moulay Abdellah", lat: 33.7100, lng: -7.4000 },
                { name: "Gare De Mohammédia", lat: 33.7121, lng: -7.4011 },
                { name: "El Matahine", lat: 33.7143, lng: -7.3995 },
                { name: "Gare Routière De Mohammédia", lat: 33.7121, lng: -7.4050 },
                { name: "Tadla", lat: 33.7100, lng: -7.4080 },
                { name: "Mosquée Du Mali", lat: 33.7090, lng: -7.4110 },
                { name: "Pharmacie El Fath", lat: 33.7070, lng: -7.4130 },
                { name: "Société Seita", lat: 33.7050, lng: -7.4150 },
                { name: "Hay Nassim Mohammedia", lat: 33.7030, lng: -7.4170 },
                { name: "Bd De La Résistance", lat: 33.7010, lng: -7.4190 },
                { name: "Douar El Wahda", lat: 33.6990, lng: -7.4210 },
                { name: "Douar Chrif", lat: 33.6970, lng: -7.4230 },
                { name: "Zone Industrielle Mohammedia T2", lat: 33.6950, lng: -7.4250 },
                { name: "Zone Industrielle Mohammedia T1", lat: 33.6930, lng: -7.4270 },
                { name: "Pharmacie Zohor", lat: 33.6910, lng: -7.4290 },
                { name: "Ecole Moulay Abdellah", lat: 33.6890, lng: -7.4310 },
                { name: "Lycée Ibn Khaldoun", lat: 33.6870, lng: -7.4330 },
                { name: "Jardin El Wahda", lat: 33.6850, lng: -7.4350 },
                { name: "Hay El Wahda", lat: 33.6830, lng: -7.4370 },
                { name: "Station El Falah", lat: 33.6810, lng: -7.4390 },
                { name: "Ecole Gph", lat: 33.6790, lng: -7.4410 },
                { name: "Terminus Rachidia III", lat: 33.6967, lng: -7.3855 }
            ]
        },
        inbound: {
            name: 'L907: Rachidia → Marjane',
            tripTime: 58,
            stops: [
                { name: "Terminus Rachidia III", lat: 33.6967, lng: -7.3855 },
                { name: "Ecole Gph", lat: 33.6790, lng: -7.4410 },
                { name: "Station El Falah", lat: 33.6810, lng: -7.4390 },
                { name: "Hay El Wahda", lat: 33.6830, lng: -7.4370 },
                { name: "Jardin El Wahda", lat: 33.6850, lng: -7.4350 },
                { name: "Lycée Ibn Khaldoun", lat: 33.6870, lng: -7.4330 },
                { name: "Ecole Moulay Abdellah", lat: 33.6890, lng: -7.4310 },
                { name: "Pharmacie Zohor", lat: 33.6910, lng: -7.4290 },
                { name: "Zone Industrielle Mohammedia T1", lat: 33.6930, lng: -7.4270 },
                { name: "Zone Industrielle Mohammedia T2", lat: 33.6950, lng: -7.4250 },
                { name: "Douar Chrif", lat: 33.6970, lng: -7.4230 },
                { name: "Douar El Wahda", lat: 33.6990, lng: -7.4210 },
                { name: "Bd De La Résistance", lat: 33.7010, lng: -7.4190 },
                { name: "Hay Nassim Mohammedia", lat: 33.7030, lng: -7.4170 },
                { name: "Société Seita", lat: 33.7050, lng: -7.4150 },
                { name: "Pharmacie El Fath", lat: 33.7070, lng: -7.4130 },
                { name: "Mosquée Du Mali", lat: 33.7090, lng: -7.4110 },
                { name: "Tadla", lat: 33.7100, lng: -7.4080 },
                { name: "Gare Routière De Mohammédia", lat: 33.7121, lng: -7.4050 },
                { name: "El Matahine", lat: 33.7143, lng: -7.3995 },
                { name: "Gare De Mohammédia", lat: 33.7121, lng: -7.4011 },
                { name: "Hôpital Moulay Abdellah", lat: 33.7100, lng: -7.4000 },
                { name: "Hay Salama", lat: 33.7080, lng: -7.3950 },
                { name: "Faculté De Lettres", lat: 33.7060, lng: -7.3920 },
                { name: "Lycée Technique", lat: 33.7020, lng: -7.4120 },
                { name: "Institut Supérieur De Technologie Appliquée (ISTA)", lat: 33.7000, lng: -7.4150 },
                { name: "Faculté De Sciences De Mohammédia", lat: 33.6980, lng: -7.4180 },
                { name: "Centre Commercial Marjane", lat: 33.6955, lng: -7.4201 }
            ]
        }
    },
    {
        id: 'L902',
        trips: generateTrips("06:11", "20:11", 40),
        outbound: {
            name: 'L902: Sidi Moumen → Mohammedia Station',
            tripTime: 50,
            stops: [
                { name: "Terminus T1 Sidi Moumen", lat: 33.5850, lng: -7.5000 },
                { name: "Résidence El Baida", lat: 33.5870, lng: -7.5050 },
                { name: "Sté. Tecna", lat: 33.5890, lng: -7.5100 },
                { name: "Primarios", lat: 33.5910, lng: -7.5150 },
                { name: "Sevam", lat: 33.5930, lng: -7.5200 },
                { name: "Sakani Ahl Loghlam", lat: 33.5950, lng: -7.5250 },
                { name: "Aéroport De Tit Mellil", lat: 33.5970, lng: -7.5300 },
                { name: "Zone Industrielle", lat: 33.6100, lng: -7.5000 },
                { name: "Ain Harrouda", lat: 33.6405, lng: -7.4720 },
                { name: "Gare De Mohammédia", lat: 33.7121, lng: -7.4011 }
            ]
        },
        inbound: {
            name: 'L902: Mohammedia Station → Sidi Moumen',
            tripTime: 50,
            stops: [
                { name: "Gare De Mohammédia", lat: 33.7121, lng: -7.4011 },
                { name: "Ain Harrouda", lat: 33.6405, lng: -7.4720 },
                { name: "Zone Industrielle", lat: 33.6100, lng: -7.5000 },
                { name: "Aéroport De Tit Mellil", lat: 33.5970, lng: -7.5300 },
                { name: "Sakani Ahl Loghlam", lat: 33.5950, lng: -7.5250 },
                { name: "Sevam", lat: 33.5930, lng: -7.5200 },
                { name: "Primarios", lat: 33.5910, lng: -7.5150 },
                { name: "Sté. Tecna", lat: 33.5890, lng: -7.5100 },
                { name: "Résidence El Baida", lat: 33.5870, lng: -7.5050 },
                { name: "Terminus T1 Sidi Moumen", lat: 33.5850, lng: -7.5000 }
            ]
        }
    }
];

function generateTimesForStop(departureTimesMinutes: number[], stopIndex: number, stopOffset: number) {
    const times = [];
    const currentDay = new Date().getDay();

    for (const depTime of departureTimesMinutes) {
        const stopTime = depTime + stopOffset;
        const h = (Math.floor(stopTime / 60)) % 24;
        const m = stopTime % 60;
        const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        
        const timeInMinutes = h * 60 + m;
        const isMorningRush = timeInMinutes >= 7 * 60 + 15 && timeInMinutes <= 9 * 60 + 45;
        const isEveningRush = timeInMinutes >= 17 * 60 && timeInMinutes <= 19 * 60 + 30;
        
        let status: 'onTime' | 'delayed' | 'cancelled' = 'onTime';
        let delayMinutes = 0;
        
        // Realistic traffic logic in Mohammedia / Casa
        const stabilityHash = (timeInMinutes * 17 + stopIndex * 11 + currentDay * 13) % 100;
        if (isMorningRush || isEveningRush) {
            if (stabilityHash > 96) {
                status = 'cancelled';
            } else if (stabilityHash > 60) {
                status = 'delayed'; // Highly likely to be delayed during rush hour
                delayMinutes = 10 + (stabilityHash % 20); // 10 to 29 min delay
            }
        } else {
            if (stabilityHash > 98) {
                status = 'cancelled';
            } else if (stabilityHash > 85) {
                status = 'delayed';
                delayMinutes = 4 + (stabilityHash % 12); // 4 to 15 min delay
            }
        }

        times.push({ time: timeString, status, delayMinutes });
    }
    return times;
}

function generateCompiledRoute(def: any, isOutbound: boolean) {
    const id = `${def.id}-${isOutbound ? 'outbound' : 'inbound'}`;
    const directionData = isOutbound ? def.outbound : def.inbound;
    const name = directionData.name;
    
    const tripsSource = (!isOutbound && def.inboundTrips) ? def.inboundTrips : def.trips;
    
    // Convert string times to minutes from midnight
    const departureTimesMinutes = tripsSource.map((timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    });
    
    const stopsList = directionData.stops;
    
    return {
        id,
        name,
        stops: stopsList.map((stop, idx) => {
            const progress = idx / Math.max(1, stopsList.length - 1);
            const offset = Math.round(progress * directionData.tripTime);
            return {
                id: `${id}-s${idx + 1}`,
                name: stop.name,
                latitude: Number(stop.lat.toFixed(6)),
                longitude: Number(stop.lng.toFixed(6)),
                times: generateTimesForStop(departureTimesMinutes, idx, offset)
            };
        })
    };
}

export function getOfflineRoutes(): BusRoute[] {
    const finalRoutes: BusRoute[] = [];
    for (const base of casabusRoutesBase) {
        finalRoutes.push(generateCompiledRoute(base, true));
        finalRoutes.push(generateCompiledRoute(base, false));
    }
    return finalRoutes;
}

/**
 * Calculates the next bus arrival at a specific stop for a specific direction.
 * 
 * @param routeId e.g. "906-outbound"
 * @param stopId e.g. "906-outbound-s1"
 * @returns The next BusTime object if available.
 */
export function getNextBusAtStop(routeId: string, stopId: string) {
    const routes = getOfflineRoutes();
    const route = routes.find(r => r.id === routeId);
    if (!route) return null;
    
    const stop = route.stops.find(s => s.id === stopId);
    if (!stop) return null;
    
    const nowRounded = new Date();
    nowRounded.setSeconds(0, 0);

    let nextTimeObj = null;
    let minTimeDiff = Infinity;

    for (const t of stop.times) {
        if (t.status === 'cancelled') continue;
        const [h, m] = t.time.split(':').map(Number);
        const target = new Date(nowRounded);
        target.setHours(h, m, 0, 0);
        
        if (t.status === 'delayed' && t.delayMinutes) {
            target.setMinutes(target.getMinutes() + t.delayMinutes);
        }
        
        let diffMinutes = Math.round((target.getTime() - nowRounded.getTime()) / 60000);
        
        if (diffMinutes < -12 * 60) {
            diffMinutes += 24 * 60; 
        }
        
        if (diffMinutes >= 0 && diffMinutes < minTimeDiff) {
            minTimeDiff = diffMinutes;
            nextTimeObj = t;
        }
    }
    
    return {
        stop,
        route,
        time: nextTimeObj,
        diffMinutes: minTimeDiff
    };
}
