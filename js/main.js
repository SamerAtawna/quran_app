var checkTime;
const baseUrl = "https://www.mp3quran.net/api/v3";
var reciters = {};
var suwar = [];
var activeReciter = null;
var activeSura = null;
var audio = new Audio(null);
var letters = [];
var recitersData = [];

//Initialize function
var init = function () {
  // TODO:: Do your initialization job
  console.log("init() called");

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      // Something you want to do when hide or exit.
    } else {
      // Something you want to do when resume.
    }
  });

  // add eventListener for keydown
  document.addEventListener("keydown", function (e) {
    switch (e.keyCode) {
      case 37: //LEFT arrow
        left();
        break;
      case 38: //UP arrow
        up();
        break;
      case 39: //RIGHT arrow
        right();
        break;
      case 40: //DOWN arrow
        down();
        break;
      case 13: //OK button
        ok();
        break;
      case 10009: //RETURN button
        tizen.application.getCurrentApplication().exit();
        break;
      default:
        console.log("Key code : " + e.keyCode);
        break;
    }
  });
};
// window.onload can work without <body onload="">
window.onload = init;

function startTime() {
  var today = new Date();
  var h = today.getHours();
  var m = today.getMinutes();
  var s = today.getSeconds();
  m = checkTime(m);
  s = checkTime(s);
  document.getElementById("divbutton1").innerHTML =
    "Current time: " + h + ":" + m + ":" + s;
  setTimeout(startTime, 10);
}

function checkTime(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}
function downloadWithTizen() {
  var url = "https://www.mp3quran.net/api/v3/reciters?language=ar";
  //check if file exists
  var file = "wgt-private-tmp/reciters.json";
  var fileObj = new tizen.filesystem.isFile(file);
  if (fileObj.exists()) {
    console.log("File exists");
    return;
  }
  var downloadRequest = new tizen.DownloadRequest(url, "wgt-private-tmp");
  tizen.download.start(downloadRequest);
  console.log("File downloaded");
  tizen.download.setListener(downloadRequest.id, {
    onprogress: function (id, receivedSize, totalSize) {
      console.log("Received: " + receivedSize + " of " + totalSize);
    },
    onpaused: function () {
      console.log("Download paused");
    },
    oncanceled: function () {
      console.log("Download canceled");
    },
    oncompleted: function (path) {
      console.log("Download completed: " + path);
      //file name
      var fileName = path.split("/").pop();
  //file content
      var fileContent = tizen.filesystem.openFile("wgt-private-tmp/" + fileName, "r");
      
      console.log(fileContent);

    },
    onfailed: function (error) {
      console.log("Download failed: " + error.name);
    },
  });


}
function getReciters() {
  downloadWithTizen();
  var url = baseUrl + "/reciters?language=ar";
  return fetch(url)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      this.recitersData = data;
      let reciters = data.reciters;
      //create reciters list by letter
      let recitersList = {};
      reciters.forEach((reciter) => {
        let letter = reciter.name.charAt(0);
        if (!recitersList[letter]) {
          recitersList[letter] = [];
        }
        recitersList[letter].push(reciter);
      });
      console.log(recitersList);
      console.log(this.letters);
      this.reciters = recitersList;
      // loop reciters and insert keys into letters array
      for (const letter in recitersList) {
        this.letters.push(letter);
      }

      //create reciters list which each row container the names of the reciters by letter and first item on row is the letter
      let recitersListHtml = "";

      const listChildrenToAnimate = [];
      for (const letter in recitersList) {
        recitersListHtml += `<div class="reciter-list-row row flex-nowrap">`;
        recitersListHtml += `<div class="reciter-letter reciter-letter col-1">${letter}</div>`;

        recitersList[letter].forEach((reciter) => {
          recitersListHtml += `<div class="reciter-name-${reciter.id} p-2 col-1" onclick="expandSuras('${letter}',${reciter.id})">
          <img src="images/quran.svg" class="reciter-photo" />
          ${reciter.name}</div>`;
        });
        listChildrenToAnimate.push(recitersList[letter]);
        recitersListHtml += `</div>`;
        recitersListHtml += `<div class="reciter-suras-${letter}">SURAS</div>`;
      }
      recitersListHtml += `<div class="letters-container">1</div>`;
      document.getElementById("reciters").innerHTML = recitersListHtml;
      const siblings = document.querySelectorAll(".reciter-list-row");
      //animate each  reciter-list-row class  children with delay
      gsap.from(siblings, {
        duration: 0.5,
        opacity: 0,
        x: -100,
        stagger: 0.1,
      });
      const firstReciter = document.querySelector(".reciter-name-1");
      firstReciter.classList.add("active");
      this.activeReciter = reciters[0];
    });
  //set first reciter as active
}

function getSuwar() {
  var url = baseUrl + "/suwar?language=ar";
  return fetch(url)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      this.suwar = data.suwar;
    });
}
expandSuras = (letter, reciterId) => {
  //add active to the selected reciter
  const reciterName = document.querySelector(`.reciter-name-${reciterId}`);
  //remove all active classes
  const activeReciters = document.querySelectorAll(".active");

  //descale the active reciter
  activeReciters.forEach((reciter) => {
    gsap.to(reciter, {
      duration: 0.5,
      scale: 1,
    });
  });
  activeReciters.forEach((reciter) => {
    reciter.classList.remove("active");
  });
  reciterName.classList.add("active");
  //remove active from the other reciters not only the siblings

  const className = `reciter-suras-${letter}`;
  // set display to flex class reciter-suras-${letter}
  $(`.${className}`).css("display", "flex");

  //remove content from other suras classes
  const surasToEmpty = document.querySelectorAll(`[class^="reciter-suras-"]`);
  surasToEmpty.forEach((sura) => {
    if (sura.className !== className) {
      sura.innerHTML = "";
      // set display to none
      $(sura).css("display", "none");
    }
  });
  //reset height to 0
  surasToEmpty.forEach((sura) => {
    if (sura.className !== className) {
      gsap.to(sura, {
        duration: 0.5,
        height: 0,
      });
    }
  });
  // expand height to 500px
  const suras = document.querySelector(`.${className}`);
  gsap.to(suras, {
    duration: 0.5,
    height: 500,
  });
  // animate
  gsap.from(suras, {
    duration: 0.5,
    opacity: 0,
    x: -100,
    stagger: 0.1,
  });
  //   select all suras classes starting with reciter-suras- and hide them
  const surasToHide = document.querySelectorAll(`[class^="reciter-suras-"]`);
  surasToHide.forEach((sura) => {
    if (sura.className !== className) {
      gsap.to(sura, {
        duration: 0.5,
        height: 0,
      });
    }
  });

  //   make the active class scale to 1.5
  gsap.to(reciterName, {
    duration: 0.5,
    scale: 1.3,
  });
  //reset the scale to 1 on siblings using gsap and jquery
  setTimeout(() => {
    $(`.reciter-name-${reciterId}`).siblings().css("transform", "scale(1)");
    //reset margin to 10px
    $(`.reciter-name-${reciterId}`).siblings().css("margin", "10px");
  }, 0);
  // load suras into reciter-suras-${letter} div - using the reciterId
  const surasContainer = document.querySelector(`.${className}`);
  surasContainer.innerHTML = "";
  const currentReciter = this.reciters[letter].find(
    (reciter) => reciter.id === reciterId
  );
  this.activeReciter = currentReciter;
  const reciterSuras = this.suwar.filter((sura) => {
    return currentReciter.moshaf[0].surah_list
      .split(",")
      .includes(sura.id.toString());
  });
  reciterSuras.forEach((sura) => {
    surasContainer.innerHTML += `<div class="sura-name m-1" onclick=playSura(${sura.id})>${sura.name}</div>`;
  });
  //   make sure .reciter-name-${reciterId} on top of viewport
  reciterName.scrollIntoView({ behavior: "smooth", block: "center" });
  //remove active class from the other reciters
};
playSura = (suraId) => {
  debugger;
  this.activeSura = this.suwar.find((sura) => sura.id === suraId);
  console.log(this.activeSura);
  $(".surah-title").text(this.activeSura.name);
  $(".reciter-subtitle").text(this.activeReciter.name);
  const server = this.activeReciter.moshaf[0].server;
  // add trailing zeros to suraId up to 3 digits
  suraId = suraId.toString().padStart(3, "0");
  const suraUrl = `${server}${suraId}.mp3`;
  console.log(suraUrl);
  this.audio.src = suraUrl;
  // hide #reciters and slide down #player
  gsap.to("#reciters", {
    opacity: 0,
    duration: 1,
    onComplete: () => {
      $("#reciters").css("display", "none");
    },
  });
  $("#player").css("opacity", "0");
  $("#player").css("display", "block");

  gsap.to("#player", {
    opacity: 1,
    duration: 1,
  });
  // set #player visiblity to visible
  // slide from right
  // gsap.to("#player", {
  //   duration: 0.5,
  //   x: 0,
  // });

  this.audio.play();
};
back = () => {
  console.log("back");
  // show #reciters and slide up #player
  gsap.to("#player", {
    duration: 1,
    opacity: 0,
    onComplete: () => {
      $("#player").css("display", "none");
    },
  });

  $("#reciters").css("opacity", "0");
  $("#reciters").css("display", "block");
  gsap.to("#reciters", {
    duration: 1,
    opacity: 1,
  });
};
Promise.all([getReciters(), getSuwar()]).then(() => {
  console.log("All data fetched");
});
function left() {
  // move the active class to the left
  const activeReciter = document.querySelector(".active");
  const nextReciter = activeReciter.nextElementSibling;
  if (!nextReciter) return;
  if (nextReciter) {
    activeReciter.classList.remove("active");
    nextReciter.classList.add("active");
    nextReciter.scrollIntoView({ behavior: "smooth", block: "center" });
    // scale the active reciter
    gsap.to(nextReciter, {
      duration: 0.5,
      scale: 1.3,
    });
    //reset the scale to 1 on siblings
    setTimeout(() => {
      const siblings = nextReciter.parentElement.children;
      for (let i = 0; i < siblings.length; i++) {
        if (siblings[i] !== nextReciter) {
          gsap.to(siblings[i], {
            duration: 0.5,
            scale: 1,
          });
        }
      }
    }, 0);
  }
  // get active reciter by class active , first class contains reciter-id
  const newActiveReciter = document.querySelector(".active");
  const activeReciterId = newActiveReciter.classList[0].split("-")[2];
  this.activeReciter = this.recitersData.reciters.find(
    (reciter) => reciter.id === parseInt(activeReciterId)
  );
  console.log(activeReciterId);
  console.log(this.activeReciter);
}
function right() {
  // move the active class to the right
  const activeReciter = document.querySelector(".active");
  const prevReciter = activeReciter.previousElementSibling;
  // check if prevReciter class containe reciter-letter if  return
  if (prevReciter.classList.contains("reciter-letter")) return;
  if (prevReciter) {
    activeReciter.classList.remove("active");
    prevReciter.classList.add("active");
    prevReciter.scrollIntoView({ behavior: "smooth", block: "center" });
    // scale the active reciter
    gsap.to(prevReciter, {
      duration: 0.5,
      scale: 1.3,
    });
    //reset the scale to 1 on siblings
    setTimeout(() => {
      const siblings = prevReciter.parentElement.children;
      for (let i = 0; i < siblings.length; i++) {
        if (siblings[i] !== prevReciter) {
          gsap.to(siblings[i], {
            duration: 0.5,
            scale: 1,
          });
        }
      }
    }, 0);
  }
  debugger;
  const newActiveReciter = document.querySelector(".active");
  const activeReciterId = newActiveReciter.classList[0].split("-")[2];
  this.activeReciter = this.recitersData.reciters.find(
    (reciter) => reciter.id === parseInt(activeReciterId)
  );
  console.log(activeReciterId);
  console.log(this.activeReciter);
}
function down() {
  debugger;
  //check if reciter-suras class is visible
  const suras = document.querySelector(
    `.reciter-suras-${activeReciter.name.trim().charAt(0)}`
  );
  if (suras.style.display === "flex") {
    //move the active class to first sura
    const activeSura = suras.children[0];
    activeSura.classList.add("active");
    //scroll to the active sura
    activeSura.scrollIntoView({ behavior: "smooth", block: "center" });
    // scale the active sura
    gsap.to(activeSura, {
      duration: 0.5,
      scale: 1.3,
    });
    //reset the scale to 1 on siblings
    setTimeout(() => {
      const siblings = activeSura.parentElement.children;
      for (let i = 0; i < siblings.length; i++) {
        if (siblings[i] !== activeSura) {
          gsap.to(siblings[i], {
            duration: 0.5,
            scale: 1,
          });
        }
      }
    }, 0);
    return;
  }
  // move the active class to the next row by detecting the active reciter letter
  // const activeReciter = document.querySelector(".active");
  // get the first letter of the active reciter
  const letter = activeReciter.name.trim().charAt(0);
  //find the next letter
  let nextLetter = this.letters[this.letters.indexOf(letter) + 1];
  if (!nextLetter) return;
  //remove active class from the other reciters not only the siblings
  document.querySelectorAll(".active").forEach((reciter) => {
    reciter.classList.remove("active");
  });
  //reset scale to 1 on all reciters classes starting with reciter-name-
  document.querySelectorAll('[class^="reciter-name-"]').forEach((reciter) => {
    gsap.to(reciter, {
      duration: 0.5,
      scale: 1,
    });
  });

  const reciterListRows = document.querySelectorAll(".reciter-list-row");
  let nextRow = null;
  reciterListRows.forEach((row) => {
    if (row.children[0].innerText === nextLetter) {
      nextRow = row;
    }
  });
  if (nextRow) {
    const reciterName = nextRow.children[1];
    reciterName.classList.add("active");
    reciterName.scrollIntoView({ behavior: "smooth", block: "center" });
    // scale the active reciter
    gsap.to(reciterName, {
      duration: 0.5,
      scale: 1.3,
    });
    //reset the scale to 1 on siblings
    setTimeout(() => {
      const siblings = reciterName.parentElement.children;
      for (let i = 0; i < siblings.length; i++) {
        if (siblings[i] !== reciterName) {
          gsap.to(siblings[i], {
            duration: 0.5,
            scale: 1,
          });
        }
      }
    }, 0);
  }

  // get active reciter by class active , first class contains reciter-id
  const newActiveReciter = document.querySelector(".active");
  const activeReciterId = newActiveReciter.classList[0].split("-")[2];
  this.activeReciter = this.recitersData.reciters.find(
    (reciter) => reciter.id === parseInt(activeReciterId)
  );
}
function ok() {
  // exapnd suras for the active reciter
  const activeReciter = document.querySelector(".active");
  const activeReciterId = activeReciter.classList[0].split("-")[2];
  const letter = activeReciter.innerText.trim().charAt(0);
  expandSuras(letter, parseInt(activeReciterId));
}
function up() {
  // move the active class to the previous row by detecting the active reciter letter
  // const activeReciter = document.querySelector(".active");
  // get the first letter of the active reciter
  const letter = activeReciter.name.trim().charAt(0);
  //find the next letter
  let prevLetter = this.letters[this.letters.indexOf(letter) - 1];
  if (!prevLetter) return;
  //remove active class from the other reciters not only the siblings
  document.querySelectorAll(".active").forEach((reciter) => {
    reciter.classList.remove("active");
  });
  //reset scale to 1 on all reciters classes starting with reciter-name-
  document.querySelectorAll('[class^="reciter-name-"]').forEach((reciter) => {
    gsap.to(reciter, {
      duration: 0.5,
      scale: 1,
    });
  });

  const reciterListRows = document.querySelectorAll(".reciter-list-row");
  let prevRow = null;
  reciterListRows.forEach((row) => {
    if (row.children[0].innerText === prevLetter) {
      prevRow = row;
    }
  });
  if (prevRow) {
    const reciterName = prevRow.children[1];
    reciterName.classList.add("active");
    reciterName.scrollIntoView({ behavior: "smooth", block: "center" });
    // scale the active reciter
    gsap.to(reciterName, {
      duration: 0.5,
      scale: 1.3,
    });
    //reset the scale to 1 on siblings
    setTimeout(() => {
      const siblings = reciterName.parentElement.children;
      for (let i = 0; i < siblings.length; i++) {
        if (siblings[i] !== reciterName) {
          gsap.to(siblings[i], {
            duration: 0.5,
            scale: 1,
          });
        }
      }
    }, 0);
  }

  // get active reciter by class active , first class contains reciter-id
  const newActiveReciter = document.querySelector(".active");
  const activeReciterId = newActiveReciter.classList[0].split("-")[2];
  this.activeReciter = this.recitersData.reciters.find(
    (reciter) => reciter.id === parseInt(activeReciterId)
  );
}
