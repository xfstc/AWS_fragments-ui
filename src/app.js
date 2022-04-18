// src/app.js

import { Auth, getUser } from "./auth.js";
import {
  getUserFragments,
  postUserFragments,
  data,
  deleteUserFragment,
  getUserFragment,
  editUserFragment,
} from "./api.js";
import { off } from "process";
import { stringify } from "querystring";

async function init() {
  // Get our UI elements
  const userSection = document.querySelector("#user");
  const loginBtn = document.querySelector("#login");
  const logoutBtn = document.querySelector("#logout");
  const sendPost = document.querySelector("#sendPost");

  // Wire up event handlers to deal with login and logout.
  loginBtn.onclick = () => {
    // Sign-in via the Amazon Cognito Hosted UI (requires redirects), see:
    // https://docs.amplify.aws/lib/auth/advanced/q/platform/js/#identity-pool-federation
    Auth.federatedSignIn();
  };
  logoutBtn.onclick = () => {
    // Sign-out of the Amazon Cognito Hosted UI (requires redirects), see:
    // https://docs.amplify.aws/lib/auth/emailpassword/q/platform/js/#sign-out
    Auth.signOut();
  };

  // See if we're signed in (i.e., we'll have a `user` object)
  const user = await getUser();
  if (!user) {
    // Disable the Logout button
    logoutBtn.disabled = true;
    return;
  }

  // Log the user info for debugging purposes
  console.log({ user });

  // Update the UI to welcome the user
  userSection.hidden = false;

  // Show the user's username
  userSection.querySelector(".username").innerText = user.username;

  // Disable the Login button
  loginBtn.disabled = true;

  // Do an authenticated request to the fragments API server and log the result
  getUserFragments(user);
}

// Post a new fragment
const form = document.getElementById("myForm");
form.onsubmit = submit;
async function submit(event) {
  const user = await getUser();
  var type = document.getElementById("type").value;
  var fragment;
  var content = document.getElementById("content").value;
  if (content.length != 0) {
    fragment = content;
  } else {
    fragment = document.getElementById("image").files[0];
  }

  postUserFragments(user, fragment, type);
  event.preventDefault();
}

// Edit fragment
const editForm = document.getElementById("editForm");
editForm.onsubmit = submitEdit;
async function submitEdit(event) {
  const user = await getUser();

  var id = document.getElementById("fragmentID").value;
  var type = document.getElementById("editType").value;
  var fragment;
  var content = document.getElementById("editContent").value;
  if (content.length != 0) {
    fragment = content;
  } else {
    fragment = document.getElementById("editFile").files[0];
  }
  event.preventDefault();

  await editUserFragment(user, id, type, fragment);
  event.preventDefault();
}

// Convert and render fragment  
const convertForm = document.getElementById("convertForm");
convertForm.onsubmit = submitConvert;
async function submitConvert(event) {
  const user = await getUser();
  var type = document.getElementById("contentType").value;
  var id =
    document.getElementById("convertID").value +
    document.getElementById("convertEXT").value;

  event.preventDefault();
  var converted = await getUserFragment(user, id);
  var html = `<p>Converted fragment: </p>`;
  if (
    type == "text/markdown" ||
    document.getElementById("convertEXT").value == ".txt"
  ) {
    var htmlSegment = `<div class="convertedFragment">
    <p>${await converted.text()}</p></div>`;
    console.log(`Converted fragment: ${await converted.text()}`);
    html += htmlSegment;
    var typeSegment = `<p>Content type after conversion: ${converted.type}</p>`;
    html += typeSegment;
  }
  if (
    type == "image/png" ||
    type == "image/jpeg" ||
    type == "image/webp" ||
    type == "image/gif"
  ) {
    var htmlSegment = `<div class="convertedFragment">
          <img src="${URL.createObjectURL(
            converted
          )}" alt="Converted Image Fragment">converted image fragment</img>
        </div>`;
    html += htmlSegment;
    var typeSegment = `<p>Content type after conversion: ${converted.type}</p>`;
    html += typeSegment;
  }
  var container = document.querySelector("#converted");
  container.innerHTML = html;
  event.preventDefault();
}

// List metadata for all fragments
getFragments.onclick = async () => {
  const user = await getUser();

  await getUserFragments(user);

  const body = document.body;
  var tbl = document.createElement("table");
  tbl.setAttribute("id", "myTable");
  var table = document.getElementById("myTable");
  if (table) {
    table.parentNode.removeChild(table);
  }
  const th = tbl.insertRow();
  const trID = th.insertCell();
  trID.appendChild(document.createTextNode("Fragment ID"));
  const trType = th.insertCell();
  trType.appendChild(document.createTextNode("Type"));
  const trSize = th.insertCell();
  trSize.appendChild(document.createTextNode("Size"));

  for (let i = 0; i < data.fragment.length; i++) {
    const tr = tbl.insertRow();
    const id = tr.insertCell();
    id.appendChild(document.createTextNode(`${data.fragment[i].id}`));
    const type = tr.insertCell();
    type.appendChild(document.createTextNode(`${data.fragment[i].type}`));
    const size = tr.insertCell();
    size.appendChild(document.createTextNode(`${data.fragment[i].size}`));
    var btnDelete = document.createElement("input");
    btnDelete.type = "button";
    btnDelete.value = "Delete";
    // Delete fragment
    btnDelete.onclick = async () => {
      await deleteUserFragment(user, data.fragment[i].id);
      await getUserFragments(user);
      tbl.deleteRow(i + 1);
    };
    const btnDlt = tr.insertCell();
    btnDlt.appendChild(btnDelete);
    var btnView = document.createElement("input");
    btnView.type = "button";
    btnView.value = "View";
    // Render fragment
    btnView.onclick = async () => {
      var viewData = await getUserFragment(user, data.fragment[i].id);
      var html = `<p>The content of fragment: </p>`;
      if (data.fragment[i].type == "text/plain") {
        var htmlSegment = `<div class="fragment">
        <p>${await viewData.text()}</p></div>`;
        html += htmlSegment;
      } else if (
        data.fragment[i].type == "text/html" ||
        data.fragment[i].type == "text/markdown"
      ) {
        var htmlSegment = `<div class="fragment">
          <iframe src="${URL.createObjectURL(
            viewData
          )}" title="Html Fragment" height="400" width="600">${data.fragment[i].type} fragment</iframe>
        </div>`;
        html += htmlSegment;
      } else if (data.fragment[i].type == "application/json") {
        var htmlSegment = `<div class="fragment">
          <p>${JSON.parse(await viewData.text())}</p></div>`;
        html += htmlSegment;
      } else if (
        data.fragment[i].type == "image/png" ||
        data.fragment[i].type == "image/jpeg" ||
        data.fragment[i].type == "image/webp" ||
        data.fragment[i].type == "image/gif"
      ) {
        var htmlSegment = `<div class="fragment">
          <img src="${URL.createObjectURL(
            viewData
          )}" alt="Image Fragment">${data.fragment[i].type} fragment</img>
        </div>`;
        html += htmlSegment;
      }
      var container = document.querySelector("#container");
      container.innerHTML = html;
    };
    const btnV = tr.insertCell();
    btnV.appendChild(btnView);
  }
  body.appendChild(tbl);
};

// Wait for the DOM to be ready, then start the app
addEventListener("DOMContentLoaded", init);
