export interface Municipality {
  id: number;
  name: string;
}

export interface District {
  id: number;
  name: string;
  municipalities: Municipality[];
}

export interface Province {
  id: number;
  name: string;
  districts: District[];
}

export const southAfricaData: Province[] = [
  {
    id: 1,
    name: "KwaZulu-Natal",
    districts: [
      {
        id: 1,
        name: "Amajuba District",
        municipalities: [
          { id: 1, name: "Newcastle" },
          { id: 2, name: "Utrecht" },
          { id: 3, name: "Dannhauser" }
        ]
      },
      {
        id: 2,
        name: "Harry Gwala District",
        municipalities: [
          { id: 4, name: "Ixopo" },
          { id: 5, name: "Underberg" },
          { id: 6, name: "Kokstad" },
          { id: 7, name: "Ubuhlebezwe" },
          { id: 8, name: "Umzimkhulu" },
          { id: 9, name: "Dr Nkosazana Dlamini Zuma" }
        ]
      },
      {
        id: 3,
        name: "iLembe District",
        municipalities: [
          { id: 10, name: "KwaDukuza" },
          { id: 11, name: "Mandeni" },
          { id: 12, name: "Maphumulo" },
          { id: 13, name: "Ndwedwe" }
        ]
      },
      {
        id: 4,
        name: "King Cetshwayo District",
        municipalities: [
          { id: 14, name: "City of uMhlathuze" },
          { id: 15, name: "uMfolozi" },
          { id: 16, name: "Nkandla" },
          { id: 17, name: "uMlalazi" }
        ]
      },
      {
        id: 5,
        name: "Ugu District",
        municipalities: [
          { id: 18, name: "Ray Nkonyeni" },
          { id: 19, name: "Umdoni" },
          { id: 20, name: "Umzumbe" },
          { id: 21, name: "uMuziwabantu" }
        ]
      },
      {
        id: 6,
        name: "uMgungundlovu District",
        municipalities: [
          { id: 22, name: "Msunduzi" },
          { id: 23, name: "uMngeni" },
          { id: 24, name: "Mpofana" },
          { id: 25, name: "Impendle" },
          { id: 26, name: "The Msunduzi" },
          { id: 27, name: "Mkhambathini" },
          { id: 28, name: "Richmond" }
        ]
      },
      {
        id: 7,
        name: "uMkhanyakude District",
        municipalities: [
          { id: 29, name: "Big 5 Hlabisa" },
          { id: 30, name: "Hluhluwe" },
          { id: 31, name: "Jozini" },
          { id: 32, name: "Mtubatuba" },
          { id: 33, name: "uMhlabuyalingana" }
        ]
      },
      {
        id: 8,
        name: "uMzinyathi District",
        municipalities: [
          { id: 34, name: "Endumeni" },
          { id: 35, name: "Nquthu" },
          { id: 36, name: "Msinga" },
          { id: 37, name: "Umvoti" }
        ]
      },
      {
        id: 9,
        name: "uThukela District",
        municipalities: [
          { id: 38, name: "Alfred Duma" },
          { id: 39, name: "Inkosi Langalibalele" },
          { id: 40, name: "Okhahlamba" },
          { id: 41, name: "Imbabazane" }
        ]
      },
      {
        id: 10,
        name: "Zululand District",
        municipalities: [
          { id: 42, name: "eDumbe" },
          { id: 43, name: "uPhongolo" },
          { id: 44, name: "AbaQulusi" },
          { id: 45, name: "Nongoma" },
          { id: 46, name: "Ulundi" }
        ]
      },
      {
        id: 11,
        name: "eThekwini Metropolitan Municipality",
        municipalities: [
          { id: 47, name: "eThekwini Metropolitan Municipality" }
        ]
      }
    ]
  },
  {
    id: 2,
    name: "Eastern Cape",
    districts: [
      {
        id: 12,
        name: "Alfred Nzo District Municipality",
        municipalities: [
          { id: 48, name: "Matatiele Local Municipality" },
          { id: 49, name: "Winnie Madikizela-Mandela Local Municipality" },
          { id: 50, name: "Ntabankulu Local Municipality" },
          { id: 51, name: "Umzimvubu Local Municipality" }
        ]
      },
      {
        id: 13,
        name: "Amathole District Municipality",
        municipalities: [
          { id: 52, name: "Mnquma Local Municipality" },
          { id: 53, name: "Great Kei Local Municipality" },
          { id: 54, name: "Amahlathi Local Municipality" },
          { id: 55, name: "Ngqushwa Local Municipality" },
          { id: 56, name: "Nkonkobe Local Municipality" },
          { id: 57, name: "Nxuba Local Municipality" },
          { id: 58, name: "Raymond Mhlaba Local Municipality" }
        ]
      },
      {
        id: 14,
        name: "Chris Hani District Municipality",
        municipalities: [
          { id: 59, name: "Emalahleni Local Municipality" },
          { id: 60, name: "Engcobo Local Municipality" },
          { id: 61, name: "Sakhisizwe Local Municipality" },
          { id: 62, name: "Lukhanji Local Municipality" },
          { id: 63, name: "Inxuba Yethemba Local Municipality" },
          { id: 64, name: "Tsolwana Local Municipality" },
          { id: 65, name: "Inkwanca Local Municipality" },
          { id: 66, name: "Enoch Mgijima Local Municipality" }
        ]
      },
      {
        id: 15,
        name: "Joe Gqabi District Municipality",
        municipalities: [
          { id: 67, name: "Elundini Local Municipality" },
          { id: 68, name: "Senqu Local Municipality" },
          { id: 69, name: "Maletswai Local Municipality" },
          { id: 70, name: "Gariep Local Municipality" }
        ]
      },
      {
        id: 16,
        name: "OR Tambo District Municipality",
        municipalities: [
          { id: 71, name: "King Sabata Dalindyebo Local Municipality" },
          { id: 72, name: "Nyandeni Local Municipality" },
          { id: 73, name: "Mhlontlo Local Municipality" },
          { id: 74, name: "Qaukeni Local Municipality" },
          { id: 75, name: "Port St Johns Local Municipality" },
          { id: 76, name: "Ingquza Hill Local Municipality" }
        ]
      },
      {
        id: 17,
        name: "Sarah Baartman District Municipality",
        municipalities: [
          { id: 77, name: "Camdeboo Local Municipality" },
          { id: 78, name: "Blue Crane Route Local Municipality" },
          { id: 79, name: "Ikwezi Local Municipality" },
          { id: 80, name: "Makana Local Municipality" },
          { id: 81, name: "Ndlambe Local Municipality" },
          { id: 82, name: "Sunday's River Valley Local Municipality" },
          { id: 83, name: "Baviaans Local Municipality" },
          { id: 84, name: "Kouga Local Municipality" },
          { id: 85, name: "Kou-Kamma Local Municipality" }
        ]
      },
      {
        id: 18,
        name: "Buffalo City Metropolitan Municipality",
        municipalities: [
          { id: 86, name: "Buffalo City Metropolitan Municipality" }
        ]
      },
      {
        id: 19,
        name: "Nelson Mandela Bay Metropolitan Municipality",
        municipalities: [
          { id: 87, name: "Nelson Mandela Bay Metropolitan Municipality" }
        ]
      }
    ]
  },
  {
    id: 3,
    name: "Free State",
    districts: [
      {
        id: 20,
        name: "Fezile Dabi District Municipality",
        municipalities: [
          { id: 88, name: "Moqhaka Local Municipality" },
          { id: 89, name: "Ngwathe Local Municipality" },
          { id: 90, name: "Metsimaholo Local Municipality" },
          { id: 91, name: "Mafube Local Municipality" }
        ]
      },
      {
        id: 21,
        name: "Lejweleputswa District Municipality",
        municipalities: [
          { id: 92, name: "Letsemeng Local Municipality" },
          { id: 93, name: "Kopanong Local Municipality" },
          { id: 94, name: "Mohokare Local Municipality" },
          { id: 95, name: "Naledi Local Municipality" },
          { id: 96, name: "Masilonyana Local Municipality" },
          { id: 97, name: "Tokologo Local Municipality" },
          { id: 98, name: "Tswelopele Local Municipality" }
        ]
      },
      {
        id: 22,
        name: "Mangaung Metropolitan Municipality",
        municipalities: [
          { id: 99, name: "Mangaung Metropolitan Municipality" }
        ]
      },
      {
        id: 23,
        name: "Xhariep District Municipality",
        municipalities: [
          { id: 100, name: "Letsemeng Local Municipality" },
          { id: 101, name: "Kopanong Local Municipality" },
          { id: 102, name: "Mohokare Local Municipality" }
        ]
      },
      {
        id: 24,
        name: "Thabo Mofutsanyane District Municipality",
        municipalities: [
          { id: 103, name: "Setsoto Local Municipality" },
          { id: 104, name: "Dihlabeng Local Municipality" },
          { id: 105, name: "Nketoana Local Municipality" },
          { id: 106, name: "Maluti-a-Phofung Local Municipality" },
          { id: 107, name: "Phumelela Local Municipality" }
        ]
      }
    ]
  },
  {
    id: 4,
    name: "Limpopo",
    districts: [
      {
        id: 26,
        name: "Capricorn District Municipality",
        municipalities: [
          { id: 108, name: "Blouberg Local Municipality" },
          { id: 109, name: "Aganang Local Municipality" },
          { id: 110, name: "Molemole Local Municipality" },
          { id: 111, name: "Polokwane Local Municipality" },
          { id: 112, name: "Lepelle-Nkumpi Local Municipality" }
        ]
      },
      {
        id: 27,
        name: "Mopani District Municipality",
        municipalities: [
          { id: 113, name: "Ba-Phalaborwa Local Municipality" },
          { id: 114, name: "Maruleng Local Municipality" },
          { id: 115, name: "Tzaneen Local Municipality" },
          { id: 116, name: "Giyani Local Municipality" },
          { id: 117, name: "Greater Letaba Local Municipality" }
        ]
      },
      {
        id: 28,
        name: "Sekhukhune District Municipality",
        municipalities: [
          { id: 118, name: "Elias Motsoaledi Local Municipality" },
          { id: 119, name: "Ephraim Mogale Local Municipality" },
          { id: 120, name: "Fetakgomo Tubatse Local Municipality" },
          { id: 121, name: "Makhuduthamaga Local Municipality" }
        ]
      },
      {
        id: 29,
        name: "Vhembe District Municipality",
        municipalities: [
          { id: 122, name: "Musina Local Municipality" },
          { id: 123, name: "Mutale Local Municipality" },
          { id: 124, name: "Thulamela Local Municipality" },
          { id: 125, name: "Makhado Local Municipality" }
        ]
      },
      {
        id: 30,
        name: "Waterberg District Municipality",
        municipalities: [
          { id: 126, name: "Bela-Bela Local Municipality" },
          { id: 127, name: "Thabazimbi Local Municipality" },
          { id: 128, name: "Lephalale Local Municipality" },
          { id: 129, name: "Modimolle-Mookgophong Local Municipality" },
          { id: 130, name: "Mogalakwena Local Municipality" }
        ]
      }
    ]
  },
  {
    id: 5,
    name: "Western Cape",
    districts: [
      {
        id: 31,
        name: "City of Cape Town Metropolitan Municipality",
        municipalities: [
          { id: 131, name: "City of Cape Town Metropolitan Municipality" }
        ]
      },
      {
        id: 32,
        name: "Cape Winelands District Municipality",
        municipalities: [
          { id: 132, name: "Witzenberg Local Municipality" },
          { id: 133, name: "Drakenstein Local Municipality" },
          { id: 134, name: "Stellenbosch Local Municipality" },
          { id: 135, name: "Breede Valley Local Municipality" },
          { id: 136, name: "Langeberg Local Municipality" }
        ]
      },
      {
        id: 33,
        name: "Central Karoo District Municipality",
        municipalities: [
          { id: 137, name: "Beaufort West Local Municipality" },
          { id: 138, name: "Laingsburg Local Municipality" },
          { id: 139, name: "Prince Albert Local Municipality" }
        ]
      },
      {
        id: 34,
        name: "Garden Route District Municipality",
        municipalities: [
          { id: 140, name: "Kannaland Local Municipality" },
          { id: 141, name: "Hessequa Local Municipality" },
          { id: 142, name: "Mossel Bay Local Municipality" },
          { id: 143, name: "George Local Municipality" },
          { id: 144, name: "Oudtshoorn Local Municipality" },
          { id: 145, name: "Bitou Local Municipality" },
          { id: 146, name: "Knysna Local Municipality" }
        ]
      },
      {
        id: 35,
        name: "Overberg District Municipality",
        municipalities: [
          { id: 147, name: "Theewaterskloof Local Municipality" },
          { id: 148, name: "Overstrand Local Municipality" },
          { id: 149, name: "Cape Agulhas Local Municipality" },
          { id: 150, name: "Swellendam Local Municipality" }
        ]
      },
      {
        id: 36,
        name: "West Coast District Municipality",
        municipalities: [
          { id: 151, name: "Matzikama Local Municipality" },
          { id: 152, name: "Cederberg Local Municipality" },
          { id: 153, name: "Bergrivier Local Municipality" },
          { id: 154, name: "Saldanha Bay Local Municipality" },
          { id: 155, name: "Swartland Local Municipality" }
        ]
      }
    ]
  },
  {
    id: 6,
    name: "Northern Cape",
    districts: [
      {
        id: 37,
        name: "Frances Baard District Municipality",
        municipalities: [
          { id: 156, name: "Dikgatlong Local Municipality" },
          { id: 157, name: "Magareng Local Municipality" },
          { id: 158, name: "Phokwane Local Municipality" },
          { id: 159, name: "Sol Plaatje Local Municipality" }
        ]
      },
      {
        id: 38,
        name: "John Taolo Gaetsewe District Municipality",
        municipalities: [
          { id: 160, name: "Ga-Segonyana Local Municipality" },
          { id: 161, name: "Gamagara Local Municipality" },
          { id: 162, name: "Joe Morolong Local Municipality" },
          { id: 163, name: "Tsantsabane Local Municipality" }
        ]
      },
      {
        id: 39,
        name: "Namakwa District Municipality",
        municipalities: [
          { id: 164, name: "Richtersveld Local Municipality" },
          { id: 165, name: "Nama Khoi Local Municipality" },
          { id: 166, name: "Kamiesberg Local Municipality" },
          { id: 167, name: "Hantam Local Municipality" },
          { id: 168, name: "Karoo Hoogland Local Municipality" },
          { id: 169, name: "Khai-Ma Local Municipality" }
        ]
      },
      {
        id: 40,
        name: "Pixley ka Seme District Municipality",
        municipalities: [
          { id: 170, name: "Ubuntu Local Municipality" },
          { id: 171, name: "Umsobomvu Local Municipality" },
          { id: 172, name: "Emthanjeni Local Municipality" },
          { id: 173, name: "Kareeberg Local Municipality" },
          { id: 174, name: "Renosterberg Local Municipality" },
          { id: 175, name: "Thembelihle Local Municipality" }
        ]
      },
      {
        id: 41,
        name: "ZF Mgcawu District Municipality",
        municipalities: [
          { id: 176, name: "Dawid Kruiper Local Municipality" },
          { id: 177, name: "Kai !Garib Local Municipality" },
          { id: 178, name: "//Khara Hais Local Municipality" },
          { id: 179, name: "!Kheis Local Municipality" },
          { id: 180, name: "Tsantsabane Local Municipality" }
        ]
      }
    ]
  },
  {
    id: 7,
    name: "Gauteng",
    districts: [
      {
        id: 42,
        name: "City of Johannesburg Metropolitan Municipality",
        municipalities: [
          { id: 181, name: "City of Johannesburg Metropolitan Municipality" }
        ]
      },
      {
        id: 43,
        name: "City of Tshwane Metropolitan Municipality",
        municipalities: [
          { id: 182, name: "City of Tshwane Metropolitan Municipality" }
        ]
      },
      {
        id: 44,
        name: "Ekurhuleni Metropolitan Municipality",
        municipalities: [
          { id: 183, name: "Ekurhuleni Metropolitan Municipality" }
        ]
      },
      {
        id: 45,
        name: "Sedibeng District Municipality",
        municipalities: [
          { id: 184, name: "Emfuleni Local Municipality" },
          { id: 185, name: "Midvaal Local Municipality" },
          { id: 186, name: "Lesedi Local Municipality" }
        ]
      },
      {
        id: 46,
        name: "West Rand District Municipality",
        municipalities: [
          { id: 187, name: "Mogale City Local Municipality" },
          { id: 188, name: "Rand West City Local Municipality" },
          { id: 189, name: "Merafong City Local Municipality" }
        ]
      }
    ]
  },
  {
    id: 8,
    name: "Mpumalanga",
    districts: [
      {
        id: 47,
        name: "Ehlanzeni District Municipality",
        municipalities: [
          { id: 190, name: "Thaba Chweu Local Municipality" },
          { id: 191, name: "Mbombela Local Municipality" },
          { id: 192, name: "Umjindi Local Municipality" },
          { id: 193, name: "Nkomazi Local Municipality" },
          { id: 194, name: "Bushbuckridge Local Municipality" }
        ]
      },
      {
        id: 48,
        name: "Gert Sibande District Municipality",
        municipalities: [
          { id: 195, name: "Chief Albert Luthuli Local Municipality" },
          { id: 196, name: "Msukaligwa Local Municipality" },
          { id: 197, name: "Mkhondo Local Municipality" },
          { id: 198, name: "Pixley Ka Seme Local Municipality" },
          { id: 199, name: "Lekwa Local Municipality" },
          { id: 200, name: "Dipaleseng Local Municipality" },
          { id: 201, name: "Govan Mbeki Local Municipality" }
        ]
      },
      {
        id: 49,
        name: "Nkangala District Municipality",
        municipalities: [
          { id: 202, name: "Victor Khanye Local Municipality" },
          { id: 203, name: "Emalahleni Local Municipality" },
          { id: 204, name: "Steve Tshwete Local Municipality" },
          { id: 205, name: "Emakhazeni Local Municipality" },
          { id: 206, name: "Thembisile Hani Local Municipality" },
          { id: 207, name: "Dr JS Moroka Local Municipality" }
        ]
      }
    ]
  },
  {
    id: 9,
    name: "North West",
    districts: [
      {
        id: 50,
        name: "Bojanala Platinum District Municipality",
        municipalities: [
          { id: 208, name: "Moretele Local Municipality" },
          { id: 209, name: "Madibeng Local Municipality" },
          { id: 210, name: "Rustenburg Local Municipality" },
          { id: 211, name: "Kgetlengrivier Local Municipality" },
          { id: 212, name: "Moses Kotane Local Municipality" }
        ]
      },
      {
        id: 51,
        name: "Dr Kenneth Kaunda District Municipality",
        municipalities: [
          { id: 213, name: "Ventersdorp Local Municipality" },
          { id: 214, name: "Tlokwe Local Municipality" },
          { id: 215, name: "Matlosana Local Municipality" },
          { id: 216, name: "Maquassi Hills Local Municipality" }
        ]
      },
      {
        id: 52,
        name: "Ngaka Modiri Molema District Municipality",
        municipalities: [
          { id: 217, name: "Ratlou Local Municipality" },
          { id: 218, name: "Tswaing Local Municipality" },
          { id: 219, name: "Mafikeng Local Municipality" },
          { id: 220, name: "Ditsobotla Local Municipality" },
          { id: 221, name: "Ramotshere Moiloa Local Municipality" }
        ]
      },
      {
        id: 53,
        name: "Dr Ruth Segomotsi Mompati District Municipality",
        municipalities: [
          { id: 222, name: "Mamusa Local Municipality" },
          { id: 223, name: "Greater Taung Local Municipality" },
          { id: 224, name: "Lekwa-Teemane Local Municipality" },
          { id: 225, name: "Kagisano-Molopo Local Municipality" },
          { id: 226, name: "Naledi Local Municipality" }
        ]
      }
    ]
  }
];