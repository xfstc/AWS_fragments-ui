// src/api.js

// fragments microservice API
const apiUrl = process.env.API_URL;
export var data;
/**
 * Given an authenticated user, request all fragments for this user from the
 * fragments microservice (currently only running locally). We expect a user
 * to have an `idToken` attached, so we can send that along with the request.
 */
export async function getUserFragments(user) {
  console.log("Requesting user fragments data...");
  try {
    const res = await fetch(`${apiUrl}/v1/fragments?expand=1`, {
      headers: {
        // Include the user's ID Token in the request so we're authorized
        Authorization: `Bearer ${user.idToken}`,
      },
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    data = await res.json();
    console.log("Got user fragments data", { data });
  } catch (err) {
    console.error("Unable to call GET /v1/fragment", { err });
  }
}

export async function postUserFragments(user, fragment, type) {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments`, {
      method: "POST",
      headers: {
        "Content-Type": type,
        Authorization: `Bearer ${user.idToken}`,
      },
      body: type == "application/json" ? JSON.stringify(fragment) : fragment,
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    await res.json();
  } catch (err) {
    console.error("Unable to call POST /v1/fragment", { err });
  }
}

export async function deleteUserFragment(user, id) {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user.idToken}`,
      },
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    console.log(`Fragment(ID: ${id} has been deleted.)`);
  } catch (err) {
    console.error("Unable to call GET /v1/fragment", { err });
  }
}

export async function getUserFragment(user, id) {
  console.log("Requesting user fragment data...");
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${user.idToken}`,
      },
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    return await res.blob();
  } catch (err) {
    console.error("Unable to call GET /v1/fragment", { err });
  }
}

export async function editUserFragment(user, id,type, fragment) {
  console.log("Editing user fragment data...");
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": type,
        Authorization: `Bearer ${user.idToken}`,
      },
      body: type == "application/json" ? JSON.stringify(fragment) : fragment,
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    console.log(await res.text());
  } catch (err) {
    console.error("Unable to call PUT /v1/fragment", { err });
  }
}
