function isSafeHttpUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function assignUrl(className, url) {
  if (typeof url !== "string" || !isSafeHttpUrl(url)) {
    return;
  }
  const elems = Array.from(document.getElementsByClassName(className));
  elems.forEach(elem => {
    // textContent avoids HTML interpretation of untrusted URL strings
    elem.textContent = url;
    if ("href" in elem) {
      elem.href = url;
    }
  });
}

document.addEventListener("DOMContentLoaded", function() {
  const discovery_url = "https://aim.thestrawgroup.com/api.json"
  fetch(discovery_url)
    .then(res => res.json())
    .then((data) => {
      Object.keys(data.v1.urls).forEach(name => {
        assignUrl(`${name}-url`, data.v1.urls[name])
      });
      assignUrl("discovery-config-url", discovery_url)
      document.getElementById("discovery-config").textContent = JSON.stringify(data, null, 2);
    })
    .catch(err => { throw err });
});
