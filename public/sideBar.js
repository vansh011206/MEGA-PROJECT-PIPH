function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("active");
  }
  
  // Open the theme selection popup
  function openThemePopup() {
    document.getElementById("theme-popup").style.display = "block";
    document.getElementById("overlay").style.display = "block";
  }
  
  // Close the theme selection popup
  function closeThemePopup() {
    document.getElementById("theme-popup").style.display = "none";
    document.getElementById("overlay").style.display = "none";
    document.getElementById("custom-image-popup").style.display = "none"; // Hide custom image upload popup
  }
  const sidebar = document.getElementById("sidebar");
  // Change the sidebar theme
  function changeTheme(theme) {
    // Reset all themes
    sidebar.classList.remove(
      "theme1",
      "theme2",
      "theme3",
      "theme4",
      "theme5",
      "theme6",
      "theme7",
      "theme8"
    );
  
    // Apply the selected theme
    sidebar.classList.add(theme);
  
    // Close the theme popup
    closeThemePopup();
  }
  
  // Reset the theme to default
  function resetTheme() {
    const sidebar = document.getElementById("sidebar");
  
    // Remove only the theme-related classes (don't remove all styles)
    sidebar.classList.remove(
      "theme1",
      "theme2",
      "theme3",
      "theme4",
      "theme5",
      "theme6",
      "theme7",
      "theme8"
    );
  
    // Remove custom background image if any
    sidebar.style.backgroundImage = "";
  
    // Close theme popup
    closeThemePopup();
  }
  
  // Open the Custom Image upload popup
  function openCustomImagePopup() {
    document.getElementById("custom-image-popup").style.display = "block";
  }
  
  // Apply custom image as background for sidebar
  function applyCustomImage() {
    const file = document.getElementById("image-upload").files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const sidebar = document.getElementById("sidebar");
        sidebar.style.backgroundImage = `url(${event.target.result})`;
        closeThemePopup();
      };
      reader.readAsDataURL(file);
    }
  }
  const logoIcon = document.querySelector(".logo");
  document.addEventListener("click", (e) => {
    if (
      e.target !== sidebar &&
      !sidebar.contains(e.target) &&
      e.target !== logoIcon &&
      !logoIcon.contains(e.target)
    ) {
      sidebar.classList.remove("active"); // Corrected from `toggle` to `remove`
    }
  });
  document.querySelectorAll(".sidebar a").forEach((link) => {
    link.addEventListener("click", () => {
      sidebar.classList.remove("active");
    });
  });
  //   document.addEventListener("click", (e) => {
  //     const themePopup = document.getElementById("theme-popup");
  //     if (
  //       e.target !== themePopup &&
  //       !themePopup.contains(e.target) &&
  //       e.target !== sidebar
  //     ) {
  //       closeThemePopup();
  //     }
  //   });
  
  document.querySelector(".support-btn").addEventListener("click", () => {
    alert("Support feature coming soon!");
  });

  document.addEventListener("DOMContentLoaded", function () {
    // Get current page URL
    const currentPage = window.location.pathname;

    // Get all sidebar links
    const sidebarLinks = document.querySelectorAll(".sidebar-link");

    sidebarLinks.forEach((link) => {
      if (link.getAttribute("href") === currentPage) {
        link.classList.add("active"); // Add active class
      }
    });
  });
  function updateNavbarProfilePhoto() {
    // Retrieve the token from localStorage (set after login)
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found; cannot update profile photo.");
      return;
    }

    // Fetch the user profile from your backend
    fetch("http://localhost:5000/api/user/profile", {
      headers: { "Authorization": token }
    })
    .then(response => response.json())
    .then(data => {
      if (data.photo) {
        // Update the .logo img src with the user's profile photo
        // Adjust the base URL as necessary (e.g., if using ngrok or a deployed URL)
        document.querySelector(".logo img").src = "http://localhost:5000/" + data.photo;
        document.querySelector(".logo2 img").src = "http://localhost:5000/" + data.photo;
      } else {
        console.log("No profile photo found; using default logo.");
      }
    })
    .catch(err => console.error("Error fetching user profile: ", err));
  }

  // Call updateNavbarProfilePhoto on page load
  window.addEventListener("load", updateNavbarProfilePhoto);