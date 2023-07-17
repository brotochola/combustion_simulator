function createAlert() {
  let d = document.createElement("div");
  d.id = "custom-alert";
  document.body.appendChild(d);

  let scr = document.createElement("style");
  scr.innerHTML = `
    #custom-alert{
        display:none;
        position: fixed;
        background: black;
        color:white;
        border-radius: 5px;
        width: min-content;
        right: 15px;
        top: 15px;
        padding: 20px;
        white-space: nowrap;
    }
  `;

  document.body.appendChild(scr);
}

function showAlert(msg) {
  let d = document.querySelector("#custom-alert");
  d.innerHTML = msg;
  d.style.display = "block";
  setTimeout(() => {
    d.style.display = "none";
    d.innerHTML = "";
  }, 3000);
}

createAlert();
