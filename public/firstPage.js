// Declare chart instances
let historicalChartInstance = null;
let pieChartInstance = null;

// Popup elements
const popup = document.getElementById("popup");
const popupText = document.getElementById("popup-text");
const closePopupButton = document.getElementById("close-popup");

closePopupButton.addEventListener("click", () => {
  popup.style.display = "none";
});

function showPopupMessage(message) {
  popupText.textContent = message;
  popup.style.display = "flex";
}

async function fetchPandemicData(pandemic, country = "global") {
  try {
    const url =
      pandemic === "covid19"
        ? `https://disease.sh/v3/covid-19/${
            country === "global" ? "all" : `countries/${country}`
          }`
        : `https://api.mockpandemics.com/${pandemic}/${country}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();

    const countryName = document.getElementById("country-name");
    const countryFlag = document.getElementById("country-flag");
    const activeCases = document.getElementById("active-cases");
    const recoveredCases = document.getElementById("recovered");
    const deathsCases = document.getElementById("deaths");
    const vaccinated = document.getElementById("vaccinated");

    // Update DOM elements
    activeCases.innerHTML = `${data.active.toLocaleString()}`;
    recoveredCases.innerHTML = `${data.recovered.toLocaleString()}`;
    deathsCases.innerHTML = `${data.deaths.toLocaleString()}`;
    vaccinated.innerHTML = `${data.tests.toLocaleString()}`;
    countryName.innerHTML = `COVID-19 data for ${country}`;
    countryFlag.innerHTML = `<img src="${data.countryInfo.flag}" />`;

    // Update the pie chart dynamically
    renderPieChart(data.active, data.recovered, data.deaths, data.tests);

    // Highlight country on map
    if (country !== "global") {
      highlightCountry(country);
    }
  } catch (error) {
    console.error("Error fetching pandemic data:", error.message);
  }
}

// Initialize the map globally
let map = L.map("map").setView([20, 0], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap contributors",
}).addTo(map);

async function fetchGeoJSON() {
  try {
    const response = await fetch(
      "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json"
    );
    if (!response.ok) throw new Error("Failed to fetch GeoJSON data");
    return await response.json();
  } catch (error) {
    console.error("Error fetching GeoJSON:", error.message);
  }
}

async function highlightCountry(selectedCountry) {
  const geoData = await fetchGeoJSON();
  if (!geoData) return;

  // Remove previous layers
  map.eachLayer((layer) => {
    if (layer instanceof L.GeoJSON) {
      map.removeLayer(layer);
    }
  });

  const filteredData = {
    type: "FeatureCollection",
    features: geoData.features.filter(
      (feature) =>
        feature.properties.name.toLowerCase() === selectedCountry.toLowerCase()
    ),
  };

  // L.geoJSON(filteredData, {
  //   // style: {
  //   //   // color: "#FF5733",
  //   //   weight: 2,
  //   //   fillOpacity: 0.4,
  //   // },
  // }).addTo(map);

  if (filteredData.features.length > 0) {
    const bounds = L.geoJSON(filteredData).getBounds();
    map.fitBounds(bounds);
  } else {
    // showPopupMessage("Country not found in the GeoJSON data.");
  }
}

async function fetchHistoricalData(country = "global") {
  try {
    const url =
      country === "global"
        ? "https://disease.sh/v3/covid-19/historical/all?lastdays=900"
        : `https://disease.sh/v3/covid-19/historical/${country}?lastdays=900`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    const timeline = country === "global" ? data : data.timeline;

    if (!timeline || !timeline.cases) throw new Error("Missing data");

    const dates = Object.keys(timeline.cases);
    const cases = Object.values(timeline.cases);
    const deaths = Object.values(timeline.deaths);
    const recovered = Object.values(timeline.recovered);

    renderChart(dates, cases, deaths, recovered, country);
  } catch (error) {
    console.error("Error fetching historical data:", error.message);
  }
}

function renderChart(dates, cases, deaths, recovered, country) {
  const ctx = document.getElementById("infectionRateChart").getContext("2d");

  if (historicalChartInstance) {
    historicalChartInstance.destroy();
  }

  historicalChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        { label: "Cases", data: cases, borderColor: "blue", fill: false },
        { label: "Deaths", data: deaths, borderColor: "red", fill: false },
        {
          label: "Recovered",
          data: recovered,
          borderColor: "green",
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `COVID-19 Historical Data for ${country}`,
        },
      },
    },
  });
}

function renderPieChart(active, recovered, deaths, vaccinated) {
  const ctx = document
    .getElementById("resourceAvailabilityChart")
    .getContext("2d");

  if (pieChartInstance) {
    pieChartInstance.destroy();
  }

  pieChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Active Cases", "Recovered", "Deaths", "Vaccinated"],
      datasets: [
        {
          data: [active, recovered, deaths, vaccinated],
          backgroundColor: ["pink", "green", "red", "purple"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "COVID-19 Distribution",
        },
      },
    },
  });
}

async function populateCountryDropdown() {
  try {
    const response = await fetch("https://disease.sh/v3/covid-19/countries");
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const countries = await response.json();
    const select = document.getElementById("country-select");
    countries.forEach((country) => {
      const option = document.createElement("option");
      option.value = country.country;
      option.textContent = country.country;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error populating country dropdown:", error.message);
  }
}
const awarenessLines = [
  "Pandemics can affect anyone, anywhere; awareness is key to prevention.",
  "Stay informed about local health guidelines during a pandemic.",
  "Hand hygiene is one of the most effective ways to prevent virus spread.",
  "Wearing masks can significantly reduce transmission of respiratory viruses.",
  "Vaccination is a critical tool in preventing severe disease during pandemics.",
  "Social distancing helps protect vulnerable populations; keep your distance.",
  "Regularly update your emergency kit with essential supplies.",
  "Mental health is just as important as physical health during a pandemic.",
  "Stay connected with family and friends, even virtually, to combat isolation.",
  "Follow reliable sources for information; misinformation can be harmful.",
  "Understand the symptoms of the disease to seek timely medical help.",
  "Support local health initiatives to strengthen community resilience.",
  "Encourage others to practice safety measures; collective action is powerful.",
  "Know your risk factors and take precautions accordingly.",
  "Prepare for potential disruptions in daily life by having a plan.",
  "Use technology to stay informed and connected during isolation.",
  "Keep your workspace clean and sanitized to minimize risk.",
  "Promote healthy habits like exercise and nutrition to boost immunity.",
  "Engage in community outreach to help those in need during crises.",
  "Stay calm and focused; panic can lead to poor decision-making.",
];

const factLines = [
  "The World Health Organization (WHO) declared COVID-19 a pandemic on March 11, 2020.",
  "Pandemics have occurred throughout history, with notable examples including the 1918 influenza pandemic.",
  "The basic reproduction number (R0) of a virus indicates its potential to spread.",
  "Vaccines can significantly reduce the severity and spread of infectious diseases.",
  "The incubation period for COVID-19 can range from 2 to 14 days.",
  "Asymptomatic individuals can still spread viruses to others.",
  "Regular handwashing with soap for at least 20 seconds is highly effective in reducing infections.",
  "The CDC recommends wearing masks in crowded or indoor settings to limit virus transmission.",
  "The impact of a pandemic can extend beyond health, affecting economies and mental health.",
  "Global collaboration is essential for effective pandemic response and vaccine distribution.",
  "The emergence of zoonotic diseases is linked to human-animal interactions.",
  "Social determinants of health can influence how communities respond to pandemics.",
  "Telemedicine has become a vital resource for healthcare access during pandemics.",
  "The effectiveness of public health measures can vary based on community compliance.",
  "Pandemics can lead to significant changes in public health policy and practice.",
  "Mental health resources should be prioritized during pandemic planning.",
  "The role of healthcare workers is crucial in managing pandemic response.",
  "Contact tracing helps identify and isolate cases to prevent further spread.",
  "The economic impact of pandemics can lead to long-term financial instability.",
  "Community resilience plays a vital role in recovery from pandemics.",
];

// Function to randomly select a line and categorize it
function getRandomLine() {
  const isAwareness = Math.random() < 0.5; // Randomly choose Awareness or Fact
  const randomLine = isAwareness
    ? awarenessLines[Math.floor(Math.random() * awarenessLines.length)]
    : factLines[Math.floor(Math.random() * factLines.length)];
  return `${isAwareness ? "Awareness:" : "Fact:"} ${randomLine}`;
}

// Set the random line as headline
// const headlineText = getRandomLine();
// document.getElementById('headline').textContent = headlineText;
function updateHeadline() {
  const headlineText = getRandomLine();
  const headlineElement = document.getElementById("headline");
  headlineElement.textContent = headlineText;

  // Restart the scroll animation
  // headlineElement.style.animation = 'none';
  // setTimeout(() => {
  //     headlineElement.style.animation = '';
  // }, 10);
}

// Initialize with a random line
updateHeadline();

// Update the headline every 15 seconds
setInterval(updateHeadline, 20000);
const circle = document.querySelector(".circle");
const rectangle = document.querySelector(".rectangle");

circle.addEventListener("click", () => {
  if (circle.classList.contains("moved")) {
    // Move back to the original position
    circle.classList.remove("moved");
    rectangle.classList.remove("hidden");
    rectangle.classList.add("visible");
  } else {
    // Move to the end of the news container
    circle.classList.add("moved");
    rectangle.classList.remove("visible");
    rectangle.classList.add("hidden");
  }
});
document
  .getElementById("country-select")
  .addEventListener("change", (event) => {
    const selectedCountry = event.target.value;
    fetchPandemicData("covid19", selectedCountry);
    fetchHistoricalData(selectedCountry);
  });

window.onload = async () => {
  await populateCountryDropdown();
  fetchPandemicData("covid19", "india"); // Fetch global data on page load
  country = "india";
};
