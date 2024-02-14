"use-strict"; // Strict mode
// ********** Import ***************
import { fetchInitialPhotosInfo, fetchPagination } from "./js/api.js";
import Toasts from "./toast-notification/toast.js";

// ********** Node-selection ***************
const searchbar = document.querySelector(".search-sec__search-box__input");
const searchIcon = document.getElementById("search-btn");
const darkModeToggle = document.querySelector("#dark-mode-toggle");
const pagination_section = document.querySelector(".pagination-sec"); //MAYA ADDED CONST
const startBtn = document.querySelector("#pagination-sec_startBtn"),
  endBtn = document.querySelector("#pagination-sec_endBtn"),
  prevNext = document.querySelectorAll(".pagination-sec_prevNext"),
  numbers = document.querySelectorAll(".pagination-sec_link"),
  images = document.querySelectorAll(".pagination-sec_img"); // <--- changed location to this

// ************ Global variables ***********
// ---------------- Pagination object -----------------

let currentPageNumber = 1;
let currentStep = 1;
const amountOfImagePerPage = 60; // ÄNDRA FRÅN 12
let currentSearch = "Iphone";
const toasts = new Toasts({
  offsetX: 20, // 20px
  offsetY: 20, // 20px
  gap: 20, // The gap size in pixels between toasts
  width: 300, // 300px
  timing: "ease", // See list of available CSS transition timings
  duration: ".5s", // Transition duration
  dimOld: true, // Dim old notifications while the newest notification stays highlighted
  position: "top-center", // top-left | top-center | top-right | bottom-left | bottom-center | bottom-right
});
// Kolla om 'darkMode' är sparad i localStorage
let darkMode = localStorage.getItem("darkMode");

// ************ Global functions ***********
const enableDarkMode = () => {
  // Lägg till klassen till body-elementet
  document.body.classList.add("darkmode");
  // Uppdatera darkMode i localStorage
  localStorage.setItem("darkMode", "enabled");
};

const disableDarkMode = () => {
  // Ta bort klassen från body-elementet
  document.body.classList.remove("darkmode");
  // Uppdatera darkMode i localStorage
  localStorage.setItem("darkMode", null);
};

// Om användaren redan har besökt och aktiverat darkMode
// starta med det aktiverat
if (darkMode === "enabled") {
  enableDarkMode();
}

// När någon klickar på knappen
darkModeToggle.addEventListener("click", () => {
  // Hämta deras darkMode-inställning
  darkMode = localStorage.getItem("darkMode");

  // Om den inte är aktiverad, aktivera den
  if (darkMode !== "enabled") {
    enableDarkMode();
    // Om den har aktiverats, stäng av den
  } else {
    disableDarkMode();
  }
});

// This function is for fetching the default images
async function searchDefaultImages() {
  try {
    searchbar.value = "Loading...";

    const result = await fetchInitialPhotosInfo(
      currentSearch,
      amountOfImagePerPage,
      currentPageNumber,
      toasts
    );

    divideAndSave(result); // MAYA: should save result in pages object, should be AWAIT?
    replaceImages(pages.page1); // MAYA: replace page 1 with result
  } catch (error) {
    toasts.push({
      title: "Fetch status",
      content: `Error: ${error.message}`,
      style: "error",
      dismissAfter: "3s", // s = seconds
      closeButton: false,
    });
  } finally {
    searchbar.value = currentSearch;
    searchbar.textContent = currentSearch;
  }
}

// This function is for fetching the wanted search-param images
async function searchImages(currentSearch, num_per_page, page_num, toasts) {
  try {
    searchbar.value = "Loading...";
    const result = await fetchInitialPhotosInfo(
      currentSearch,
      num_per_page,
      page_num,
      toasts
    );

    numbers.forEach((el, i) => {
      if (i === 0) {
        el.classList.add("pagination-sec_active");
      } else {
        el.classList.remove("pagination-sec_active");
      }
    });
    currentPageNumber = 1;
    currentStep = 1;
    divideAndSave(result); // MAYA LAGT TILL: Divides the result of 60 in object with 5 pages
    replaceImages(pages.page1); // Replaces the first page with result
    scrollIntoView(pagination_section);
  } catch (error) {
    toasts.push({
      title: "Fetch status",
      content: `Error: ${error.message}`,
      style: "error",
      dismissAfter: "3s", // s = seconds
      closeButton: false,
    });
  } finally {
    searchbar.value = currentSearch;
    searchbar.textContent = currentSearch;
  }
}

// *** This function is in charge of updating the pagination_Images variable
// *** with the default images.
window.addEventListener("DOMContentLoaded", async () => {
  await searchDefaultImages();
});

// ************** Node-EventListeners ***************
searchbar.addEventListener("input", (e) => (currentSearch = e.target.value));

// ******* Search - eventListener **
searchIcon.addEventListener("click", async () => {
  currentPageNumber = 1;

  await searchImages(
    currentSearch,
    amountOfImagePerPage,
    currentPageNumber,
    toasts
  );
});

// **** Scroll node-element-into-view function
function scrollIntoView(nodeEl) {
  return nodeEl.scrollIntoView({
    behavior: "smooth",
    block: "end",
    inline: "end",
  });
}

// ************************* Pagination  **************************

// SELECTING DOM-ELEMENTS

// GLOBAL VARIABLES

// Sökresultatet hämtar 60 bildadresser
// Dessa delas upp 12 arrayer i som fördelas på 5 sidor

// 1. Ett tomt objekt för alla sidor
let pages = {
  page1: [], // <---- Default search result ------- IDÈ: Hämta 60 bilder från början
  page2: [],
  page3: [],
  page4: [],
  page5: [],
};

// 2. En funktion som sparar sökresultatet i objektet
function divideAndSave(searchResult) {
  pages.page1 = searchResult.slice(0, 12);
  pages.page2 = searchResult.slice(12, 24);
  pages.page3 = searchResult.slice(24, 36);
  pages.page4 = searchResult.slice(36, 48);
  pages.page5 = searchResult.slice(48, 61);
}

// 3. En funktion, som beroende på vilken sida det är, ersätter img.src med det sparade resultatet
function replaceImages(page) {
  images.forEach((img, i) => {
    // Denna ersätter endast sida 1, måste göra så den
    img.src = page[i]; // vet vilken sida den ska hämta
  });
}

// 4. Knapparna ändrar dels utseende och skickar dels rätt sida till funktionen som ersätter bildkällorna

// PAGE NUMBERS

numbers.forEach((number, numIndex) => {
  number.addEventListener("click", async (e) => {
    e.preventDefault();
    currentStep = numIndex + 1;

    document
      .querySelector(".pagination-sec_active")
      .classList.remove("pagination-sec_active");

    number.classList.add("pagination-sec_active");

    updateBtn(); // Uppdaterar sidan

    if (currentStep == 1) {
      // Skickar rätt sida till funktion (inte snyggt men funkar)
      replaceImages(pages.page1);
    } else if (currentStep == 2) {
      replaceImages(pages.page2);
    } else if (currentStep == 3) {
      replaceImages(pages.page3);
    } else if (currentStep == 4) {
      replaceImages(pages.page4);
    } else if (currentStep == 5) {
      replaceImages(pages.page5);
    }
  });
});

//START and END BUTTONS

startBtn.addEventListener("click", async () => {
  document
    .querySelector(".pagination-sec_active")
    .classList.remove("pagination-sec_active");
  numbers[0].classList.add("pagination-sec_active");
  currentStep = 1;
  updateBtn();
  endBtn.disabled = false;
  prevNext[1].disabled = false;

  replaceImages(pages.page1);
});

endBtn.addEventListener("click", async () => {
  document
    .querySelector(".pagination-sec_active")
    .classList.remove("pagination-sec_active");
  numbers[4].classList.add("pagination-sec_active");
  currentStep = 5;
  updateBtn();
  startBtn.disabled = false;
  prevNext[0].disabled = false;

  replaceImages(pages.page5);
});

// PREV-NEXT BUTTONS

prevNext.forEach((button) => {
  button.addEventListener("click", async (e) => {
    if (e.target.id === "next") {
      currentStep = currentStep >= 4 ? 5 : currentStep + 1;
      if (currentStep == 1) {
        replaceImages(pages.page1);
      } else if (currentStep == 2) {
        replaceImages(pages.page2);
      } else if (currentStep == 3) {
        replaceImages(pages.page3);
      } else if (currentStep == 4) {
        replaceImages(pages.page4);
      } else if (currentStep == 5) {
        replaceImages(pages.page5);
      }
    } else if (e.target.id === "prev") {
      currentStep = currentStep <= 2 ? 1 : currentStep - 1;
      if (currentStep == 1) {
        replaceImages(pages.page1);
      } else if (currentStep == 2) {
        replaceImages(pages.page2);
      } else if (currentStep == 3) {
        replaceImages(pages.page3);
      } else if (currentStep == 4) {
        replaceImages(pages.page4);
      } else if (currentStep == 5) {
        replaceImages(pages.page5);
      }
    }

    numbers.forEach((number, numIndex) => {
      number.classList.toggle(
        "pagination-sec_active",
        numIndex + 1 === currentStep
      );
      updateBtn();
    });
  });
});

// UPDATE BUTTON

const updateBtn = () => {
  if (currentStep === 5) {
    endBtn.disabled = true;
    prevNext[1].disabled = true;
  } else if (currentStep === 1) {
    startBtn.disabled = true;
    prevNext[0].disabled = true;
  } else {
    endBtn.disabled = false;
    prevNext[1].disabled = false;
    startBtn.disabled = false;
    prevNext[0].disabled = false;
  }
};


/******Carousel stuff ******************/



// Function to create slides with images
async function createImageSlides() {
  const imageUrls = await fetchPagination (currentSearch, 20, 1);
  // Find the swiper-wrapper element in the document
  const swiperWrapper = document.querySelector('.swiper-wrapper');

  // Check if swiperWrapper exists
  if (!swiperWrapper) {
      console.warn('swiper-wrapper not found.');
      return;
  }

  // Clear existing content
  swiperWrapper.innerHTML = '';

  // Loop through each URL in the array
  imageUrls.forEach(url => {
      // Create a new div element for the slide
      const slideElement = document.createElement('div');
      slideElement.className = 'swiper-slide';
      
      // Create an img element for the image
      const imgElement = document.createElement('img');
      imgElement.src = url;
      imgElement.alt = 'Image slide';
      
      // Append the img to the slide div
      slideElement.appendChild(imgElement);
      
      // Append the new slide to the swiper-wrapper
      swiperWrapper.appendChild(slideElement);
  });

const swiper = new Swiper('.swiper', {
  // Optional parameters
  // direction: 'vertical',
  loop: true,
  // slidesPerView: 3,
  effect: "coverflow",
      grabCursor: true,
      centeredSlides: true,
      slidesPerView: 2,
      coverflowEffect: {
        rotate: -5,
        stretch: 20,
        depth: 200,
        modifier: 3,
        slideShadows: true,
      },
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },


  // If we need pagination
  pagination: {
    el: '.swiper-pagination',
  },

  // Navigation arrows
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },

  // And if we need scrollbar
  scrollbar: {
    el: '.swiper-scrollbar',
  },
})};
// Call the function with the image URLs array
createImageSlides();




